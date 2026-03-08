from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import math
import database

# Initialize the app
app = FastAPI(title="Ghostbusters API")

#Allow the React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for small projects
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# data validation, pydantic models
class PlayerLocation(BaseModel):
    username: str
    lat: float
    lon: float

# math engine
def get_distance(lat1, lon1, lat2, lon2):
    """
    Calculates distance. Uses Haversine for GPS coordinates.
    """
    R = 6371000  # Radius of Earth in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def calculate_flee_vector(p_lat, p_lon, g_lat, g_lon):
    """Pushes the ghost further away along the same vector."""
    v_lat = g_lat - p_lat
    v_lon = g_lon - p_lon
    
    # 1.5 multiplier pushes it 50% further away
    return g_lat + (v_lat * 1.5), g_lon + (v_lon * 1.5)

# api endpoints

@app.get("/")
def health_check():
    return {"status": "online", "message": "Ghostbusters Backend is running!"}

@app.post("/radar")
def radar_scan(player: PlayerLocation):
    """Passive scan. Tells the player how close they are without spooking the ghost."""
    # HARDCODED GHOST for test 
    # DB partner: replace this with coordinates of ghost queried from the db
    nearest_ghost = {
        "id": 1, 
        "type": "Poltergeist", 
        "lat": 13.0285, # Rough coordinates for MSRIT area
        "lon": 77.5653 
    }
    
    distance = get_distance(player.lat, player.lon, nearest_ghost["lat"], nearest_ghost["lon"])
    
    # Signal strength based on distance
    if distance <= 15:
        signal = "Strong (Very close!)"
    elif distance <= 50:
        signal = "Medium (Getting warmer...)"
    elif distance <= 150:
        signal = "Weak (Faint reading)"
    else:
        signal = "None (No EMF detected)"
        
    return {
        "status": "radar_ping",
        "signal_strength": signal,
        "distance_meters": round(distance)
    }

@app.post("/capture")
def capture_ghost(player: PlayerLocation):
    """Active catch attempt. If you miss, you might spook the ghost."""
    # HARDCODED GHOST for test 
    # DB partner: replace this with coordinates of ghost queried from the db
    nearest_ghost = {
        "id": 1, 
        "type": "Poltergeist", 
        "lat": 13.0285, # Rough coordinates for MSRIT area
        "lon": 77.5653 
    }
    
    distance = get_distance(player.lat, player.lon, nearest_ghost["lat"], nearest_ghost["lon"])
    
    # LOGIC 1: Player is right on top of it (Busted!)
    if distance <= 5:
        # DB: Add points to the user (let's say 100 points for a Poltergeist)
        new_score = database.add_points(player.username, 100)
        
        return {
            "status": "busted",
            "message": f"You trapped the {nearest_ghost['type']}!",
            "distance_meters": round(distance),
            "points_earned": 100,
            "total_points": new_score
        }
        
    # LOGIC 2: Player swung the trap but was too far away, and ghost flees!
    elif distance <= 30:
        new_lat, new_lon = calculate_flee_vector(player.lat, player.lon, nearest_ghost["lat"], nearest_ghost["lon"])
        # TODO: DB partner to update the database with these new coordinates
        return {
            "status": "spooked",
            "message": "You missed your trap! The ghost got spooked and fled.",
            "new_lat": new_lat,
            "new_lon": new_lon,
            "distance_meters": round(distance)
        }
        
    # LOGIC 3: Player swung their trap at totally empty air.
    else:
        return {
            "status": "missed",
            "message": "You swung your trap at nothing!",
            "distance_meters": round(distance)
        }