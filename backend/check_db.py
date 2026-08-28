import sqlite3

conn = sqlite3.connect('app.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
print("Tables:", cursor.fetchall())

try:
    cursor.execute("SELECT * FROM user_logs LIMIT 20")
    rows = cursor.fetchall()
    print(f"user_logs rows: {len(rows)}")
    for row in rows:
        print(row)
except Exception as e:
    print("Error querying user_logs:", e)

cursor.close()
conn.close()
