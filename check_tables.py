import sqlite3
import os

# Check if the database file exists
db_path = 'backend/data.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if tables exist
    tables = ['floors', 'areas', 'sub_areas']
    for table in tables:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
        result = cursor.fetchone()
        print(f'{table.capitalize()} table exists:', result is not None)
    
    # Check foreign key constraints
    try:
        cursor.execute("PRAGMA foreign_key_list(areas)")
        fk_areas = cursor.fetchall()
        print("Foreign keys for areas table:", fk_areas)
        
        cursor.execute("PRAGMA foreign_key_list(sub_areas)")
        fk_sub_areas = cursor.fetchall()
        print("Foreign keys for sub_areas table:", fk_sub_areas)
    except Exception as e:
        print("Error checking foreign keys:", e)
    
    conn.close()
else:
    print("Database file does not exist")