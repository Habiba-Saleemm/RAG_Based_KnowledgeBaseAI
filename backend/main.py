"""
main.py
FastAPI backend for Register / Login.

Run with:  uvicorn main:app --reload --port 5000
"""

import os
import secrets
import hashlib
from datetime import datetime, timedelta
from urllib import response

import bcrypt
import mysql.connector
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from db import get_connection
from schemas import RegisterRequest, LoginRequest
from validators import validate_email, validate_password, validate_name


load_dotenv()

app = FastAPI(title="Auth API")

# Only allow your Next.js frontend to call this API
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
    allow_credentials=True,
)

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


def error_response(errors: dict, status_code: int):
    """Same JSON shape the frontend already expects: { success, errors }."""
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "errors": errors},
    )


# ---------------------------------------------------------------------------
# REGISTER
# ---------------------------------------------------------------------------
@app.post("/api/register")
def register(payload: RegisterRequest):
    name = payload.name
    email = payload.email.strip().lower()
    password = payload.password
    confirm_password = payload.confirmPassword

    errors = {}

    name_error = validate_name(name)
    if name_error:
        errors["name"] = name_error

    email_error = validate_email(email)
    if email_error:
        errors["email"] = email_error

    password_error = validate_password(password)
    if password_error:
        errors["password"] = password_error

    if not confirm_password.strip():
        errors["confirmPassword"] = "Please confirm your password."
    elif password != confirm_password:
        errors["confirmPassword"] = "Passwords do not match."

    if errors:
        return error_response(errors, 400)

    # Hash the password — NEVER store plain text.
    # bcrypt automatically generates a random salt per password.
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s)",
            (name.strip(), email, password_hash),
        )
        conn.commit()
        cursor.close()
    except mysql.connector.IntegrityError:
        # UNIQUE constraint on email triggered this
        return error_response(
            {"email": "An account with this email already exists."}, 409
        )
    except mysql.connector.Error:
        return error_response({"general": "Server error. Please try again."}, 500)
    finally:
        if conn:
            conn.close()

    return JSONResponse(
        status_code=201,
        content={"success": True, "message": "Account created successfully."},
    )


# ---------------------------------------------------------------------------
# LOGIN
# ---------------------------------------------------------------------------
@app.post("/api/login")
def login(payload: LoginRequest):
    email = payload.email.strip().lower()
    password = payload.password

    errors = {}
    email_error = validate_email(email)
    if email_error:
        errors["email"] = email_error
    if not password.strip():
        errors["password"] = "Please enter your password."

    if errors:
        return error_response(errors, 400)


    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, name, email, password_hash, failed_login_attempts, locked_until "
            "FROM users WHERE email = %s",
            (email,),
        )
        user = cursor.fetchone()

        if not user:
            return error_response(
        {"general": "This email is not registered. Please create an account first."},
        404,
    )

        # Check account lockout
        if user["locked_until"] and user["locked_until"] > datetime.now():
            wait_minutes = int((user["locked_until"] - datetime.now()).total_seconds() // 60) + 1
            return error_response(
                {"general": f"Account temporarily locked. Try again in {wait_minutes} minute(s)."},
                423,
            )

        password_ok = bcrypt.checkpw(password.encode("utf-8"), user["password_hash"].encode("utf-8"))

        if not password_ok:
            attempts = user["failed_login_attempts"] + 1
            locked_until = None
            if attempts >= MAX_FAILED_ATTEMPTS:
                locked_until = datetime.now() + timedelta(minutes=LOCKOUT_MINUTES)

            cursor.execute(
                "UPDATE users SET failed_login_attempts = %s, locked_until = %s WHERE id = %s",
                (attempts, locked_until, user["id"]),
            )
            conn.commit()
            return error_response(
                {"general": "Invalid email or password."},
                401,
            )

        # Success — reset failed attempts
        cursor.execute(
            "UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = %s",
            (user["id"],),
        )
        conn.commit()
        cursor.close()

    except mysql.connector.Error:
        return error_response({"general": "Server error. Please try again."}, 500)
    finally:
        if conn:
            conn.close()

    response = JSONResponse(content={
        "success": True,
        "message": "Login successful.",
        "user": {"id": user["id"], "name": user["name"], "email": user["email"]},
    })
    response.set_cookie(
        key="session_token",
        value=secrets.token_urlsafe(32),
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24,
    )
    return response
    # ---------------------------------------------------------------------------
# LOGOUT
# ---------------------------------------------------------------------------
@app.post("/api/logout")
def logout():
    response = JSONResponse(content={"success": True, "message": "Logged out."})
    response.delete_cookie("session_token")
    return response