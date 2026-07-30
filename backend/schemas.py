"""
schemas.py
Pydantic request/response models.

Note: fields are kept as plain `str` (not EmailStr / regex constraints)
because we want our OWN detailed, per-case error messages from
validators.py — not FastAPI's generic 422 validation errors.
"""

from pydantic import BaseModel


class RegisterRequest(BaseModel):
    name: str = ""
    email: str = ""
    password: str = ""
    confirmPassword: str = ""


class LoginRequest(BaseModel):
    email: str = ""
    password: str = ""


