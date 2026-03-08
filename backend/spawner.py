import math
import random

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


# Standalone Testing Block
# This code ONLY runs if you execute `python spawner.py` directly.
# It allows us to simulate and test ghost generation without breaking the actual API.
if __name__ == "__main__":
    print("-" * 50)
    print("👻 GHOSTBUSTERS SPAWNING SYSTEM TEST 👻")
    print("-" * 50)
    
    # Mock player location (e.g., MSRIT Campus area)
    test_player_lat = 13.02850
    test_player_lon = 77.56530
    
    print(f"[SYSTEM] Receiving Player Location: Lat {test_player_lat}, Lon {test_player_lon}")
    print("[SYSTEM] Calculating optimal spawn coordinates within 20m radius...\n")
    
    # Generate ghosts magically right around the player!
    spawned_ghosts = generate_ghosts_near_player(
        player_lat=test_player_lat, 
        player_lon=test_player_lon, 
        count=4, 
        min_radius=5, 
        max_radius=20
    )
    
    # Let's see the results!
    for g in spawned_ghosts:
        # We limit the printout to 6 decimal places because GPS precision gets weird past that
        print(f"✅ Spawned [{g['type']}]")
        print(f"   -> Coordinates: {g['lat']:.6f}, {g['lon']:.6f}")
        print(f"   -> Distance from Player: {g['distance_from_player']} meters\n")
