import math
import random
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI app for the spawner
app = FastAPI(title="Ghostbusters Spawner API")

# Allow the frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PlayerLocation(BaseModel):
    lat: float
    lon: float

def generate_ghosts_near_player(player_lat, player_lon, count=3, min_radius=5, max_radius=20):
    """
    Generates dynamic ghost coordinates within a small radius around a player's GPS location.
    
    Args:
        player_lat (float): Latitude of the player
        player_lon (float): Longitude of the player
        count (int): Number of ghosts to generate
        min_radius (int): Minimum distance from player in meters
        max_radius (int): Maximum distance from player in meters
        
    Returns:
        list[dict]: A list of generated ghosts
    """
    
    # simple list of ghost entities to spawn
    ghost_types = ["Poltergeist", "Banshee", "Phantom", "Specter", "Wraith"]
    
    ghosts = []
    R = 6371000  # earth's radius in meters
    
    for i in range(count):
        # 1. Determine a random distance between min_radius and max_radius
        distance = random.uniform(min_radius, max_radius)
        
        # 2. Determine a random bearing (direction) in degrees (0 to 360)
        bearing = random.uniform(0, 360)
        
        # 3. Use trigonometry (Haversine-based formula) to calculate the exact new lat/lon mathematically
        lat1 = math.radians(player_lat)
        lon1 = math.radians(player_lon)
        brng = math.radians(bearing)
        
        lat2 = math.asin(math.sin(lat1) * math.cos(distance / R) + 
                         math.cos(lat1) * math.sin(distance / R) * math.cos(brng))
                         
        lon2 = lon1 + math.atan2(math.sin(brng) * math.sin(distance / R) * math.cos(lat1),
                                 math.cos(distance / R) - math.sin(lat1) * math.sin(lat2))
                                 
        # Convert back to degrees
        new_lat = math.degrees(lat2)
        new_lon = math.degrees(lon2)
        
        # 4. Construct the ghost object
        ghost = {
            "id": i + 1,
            "type": random.choice(ghost_types),
            "lat": new_lat,
            "lon": new_lon,
            "distance_from_player": round(distance, 2)
        }
        
        ghosts.append(ghost)
        
    return ghosts


@app.post("/spawn")
def spawn_ghosts_endpoint(location: PlayerLocation):
    """
    Endpoint for the frontend to send the player's location.
    The backend will then generate ghosts near that location.
    """
    print(f"\n[SYSTEM] Received location from frontend: Lat {location.lat}, Lon {location.lon}")
    print("[SYSTEM] Calculating optimal spawn coordinates within 20m radius...")
    
    spawned_ghosts = generate_ghosts_near_player(
        player_lat=location.lat, 
        player_lon=location.lon, 
        count=4, 
        min_radius=5, 
        max_radius=20
    )
    
    for g in spawned_ghosts:
        print(f"✅ Spawned [{g['type']}] -> Distance: {g['distance_from_player']}m")
        
    return {
        "status": "success",
        "message": "Ghosts generated successfully!",
        "generated_ghosts": spawned_ghosts
    }

# Standalone Testing Block & Server Runner
if __name__ == "__main__":
    import uvicorn
    print("-" * 50)
    print("👻 GHOSTBUSTERS SPAWNING API STARTING 👻")
    print("-" * 50)
    print("Run your frontend, and it can now send its location to this server!")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
