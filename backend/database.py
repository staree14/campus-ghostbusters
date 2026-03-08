import sqlite3

DB_NAME = "ghostbusters.db"

def init_db():
    """Initializes the database and creates the necessary tables."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Create a table to store users and their points
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            points INTEGER DEFAULT 0
        )
    ''')
    
    conn.commit()
    conn.close()

def add_points(username: str, points: int):
    """Adds points to a user. If the user doesn't exist, creates them."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT points FROM users WHERE username = ?", (username,))
    result = cursor.fetchone()
    
    if result:
        # User exists, update points
        new_points = result[0] + points
        cursor.execute("UPDATE users SET points = ? WHERE username = ?", (new_points, username))
    else:
        # User doesn't exist, insert new user with points
        new_points = points
        cursor.execute("INSERT INTO users (username, points) VALUES (?, ?)", (username, new_points))
        
    conn.commit()
    conn.close()
    
    return new_points

def get_points(username: str):
    """Gets the current points for a user."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute("SELECT points FROM users WHERE username = ?", (username,))
    result = cursor.fetchone()
    conn.close()
    
    if result:
        return result[0]
    return 0

# Run init_db when the module is imported so the table is always ready
init_db()
