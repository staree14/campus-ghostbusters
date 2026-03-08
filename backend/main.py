import math
import random
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from db.database import engine, Base, get_db
from models import user, ghost
from schemas.radar_schema import RadarRequest  # Ensure these match your filenames
from schemas.capture_schema import CaptureRequest
from schemas.user_schema import UserCreate
from ml.spawner import generate_ghosts_near_player

app = FastAPI(title="Ghostbusters Pro API")

# 1. Enable CORS so React/Mobile can connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# --- MATH UTILITIES ---

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1-a))

def calculate_flee_vector(p_lat, p_lon, g_lat, g_lon):
    """Pushes ghost 50% further away if spooked"""
    return g_lat + (g_lat - p_lat) * 1.5, g_lon + (g_lon - p_lon) * 1.5

# --- API ENDPOINTS ---

@app.post("/spawn")
def spawn_ghosts(data: RadarRequest, db: Session = Depends(get_db)):

    generated_ghosts = generate_ghosts_near_player(
        player_lat=data.lat,
        player_lon=data.lon,
        count=4
    )

    new_ghosts = []

    for g in generated_ghosts:
        db_ghost = ghost.Ghost(
            type=g["type"],
            lat=g["lat"],
            lon=g["lon"],
            captured=False
        )

        db.add(db_ghost)
        new_ghosts.append(db_ghost)

    db.commit()

    return {
        "status": "success",
        "message": "4 ghosts spawned and saved to DB!"
    }

@app.post("/radar")
def radar(data: RadarRequest, db: Session = Depends(get_db)):
    ghosts = db.query(ghost.Ghost).filter(ghost.Ghost.captured == False).all()
    nearby = []
    for g in ghosts:
        dist = haversine(data.lat, data.lon, g.lat, g.lon)
        if dist < 150:
            nearby.append({
                "id": g.id, "type": g.type, "distance": round(dist, 2),
                "signal": "Strong" if dist < 20 else "Medium" if dist < 50 else "Weak"
            })
    return {"ghosts": nearby}

@app.post("/capture")
def capture(data: CaptureRequest, db: Session = Depends(get_db)):
    g = db.query(ghost.Ghost).filter(ghost.Ghost.id == data.ghost_id).first()
    if not g or g.captured:
        return {"status": "error", "message": "Ghost not found or already caught"}

    dist = haversine(data.lat, data.lon, g.lat, g.lon)

    if dist <= 7:  # SUCCESS
        g.captured = True
        u = db.query(user.User).filter(user.User.id == data.user_id).first()
        if u: u.points += 100
        db.commit()
        return {"status": "busted", "points": 100}

    elif dist <= 30:  # SPOOKED
        new_lat, new_lon = calculate_flee_vector(data.lat, data.lon, g.lat, g.lon)
        g.lat, g.lon = new_lat, new_lon
        db.commit()
        return {"status": "spooked", "message": "The ghost fled!"}

    return {"status": "missed", "message": "Too far away!"}
@app.post("/create-user")
def create_user(data: UserCreate, db: Session = Depends(get_db)):

    # check if username already exists
    existing = db.query(user.User).filter(user.User.username == data.username).first()

    if existing:
        return {
            "status": "exists",
            "user_id": existing.id,
            "points": existing.points
        }

    new_user = user.User(
        username=data.username,
        points=0
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "status": "created",
        "user_id": new_user.id,
        "username": new_user.username,
        "points": new_user.points
    }
