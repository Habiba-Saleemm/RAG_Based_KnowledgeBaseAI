"""
db.py
Handles the MySQL connection pool.
Credentials come from environment variables (.env) — never hard-code them.
"""

import os
import mysql.connector
from mysql.connector import pooling
from dotenv import load_dotenv

load_dotenv()

dbconfig = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "authapp"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "authdb"),
}

# Connection pool = faster + safer than opening a new connection per request
pool = pooling.MySQLConnectionPool(
    pool_name="auth_pool",
    pool_size=5,
    **dbconfig,
)


def get_connection():
    """Get a connection from the pool. Always close it (use try/finally)."""
    return pool.get_connection()
