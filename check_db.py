import sqlite3

# Connect to the database
conn = sqlite3.connect('backend/data/webui.db')
cursor = conn.cursor()

# Get all table names
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()

print("Existing tables:")
for table in tables:
    print(f"  - {table[0]}")

# Check if event_data table exists
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='event_data'")
result = cursor.fetchone()
if result:
    print("\nTable 'event_data' already exists")
else:
    print("\nTable 'event_data' does not exist")

conn.close()