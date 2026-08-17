"""
main.py
FastAPI backend for Register / Login / Forgot Password flow.

Run with:  uvicorn main:app --reload --port 5000
"""

import os
import secrets
import random
import hashlib
from datetime import datetime, timedelta
from urllib import request
from models import FAQ

import bcrypt
import mysql.connector
from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from embeddings import embed_text, serialize_embedding, find_best_faq_match, find_best_match, is_greeting, GREETING_RESPONSE
from about_content import ABOUT_KNOWLEDGE
from models import FAQ, Document, DocumentChunk
from schemas import DocumentResponse
from document_processing import extract_text, chunk_text, extract_qa_pairs


from database import Base, engine, get_db
from db import get_connection

from schemas import (
    FAQCreate,
    FAQResponse,
    FAQUpdate,
    AskRequest,
    AskResponse,
    RegisterRequest,
    LoginRequest,
    ForgotPasswordRequest,
    VerifyCodeRequest,
    UpdatePasswordRequest,
    AdminCreateUserRequest,
    AdminUpdateUserRequest,
)
from validators import validate_email, validate_password, validate_name

load_dotenv()

app = FastAPI(title="Auth API")

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
ADMIN_REGISTRATION_KEY = os.getenv("ADMIN_REGISTRATION_KEY", "")
COOKIE_SECURE = FRONTEND_ORIGIN.startswith("https://")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15
PIN_EXPIRY_MINUTES = 10
SESSION_MAX_AGE_SECONDS = 60 * 60 * 24  # 24 hours
MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024  # 10MB
ALLOWED_UPLOAD_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".txt"}

def error_response(errors: dict, status_code: int):
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "errors": errors},
    )


def hash_token(raw_token: str) -> str:
    """We only ever store a SHA-256 hash of a session token, never the raw value."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def is_admin_user(user: dict) -> bool:
    return user.get("role") == "admin"


def ensure_users_role_column():
    """Adds users.role when missing so role-based auth works on existing DBs."""
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user'"
        )
        conn.commit()
        cursor.close()
    except mysql.connector.Error as err:
        # MySQL duplicate-column error means the migration already ran.
        if err.errno != 1060:
            raise RuntimeError("Failed to ensure users.role column exists.") from err
    finally:
        if conn:
            conn.close()


def create_session(cursor, conn, user_id: int) -> str:
    """Generate a new session token, store its hash, return the RAW token
    (the raw token is what goes in the cookie; the hash is what's stored)."""
    raw_token = secrets.token_urlsafe(32)
    expires_at = datetime.now() + timedelta(seconds=SESSION_MAX_AGE_SECONDS)
    cursor.execute(
        "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (%s, %s, %s)",
        (hash_token(raw_token), user_id, expires_at),
    )
    conn.commit()
    return raw_token


def get_current_user(request: Request):
    """Look up the session_token cookie against the sessions table.
    Returns the user dict if the session is valid and not expired, else None.
    This is the server-side source of truth — unlike middleware, it can't be
    fooled by an arbitrary cookie value someone sets manually."""
    raw_token = request.cookies.get("session_token")
    if not raw_token:
        return None

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """SELECT u.id, u.name, u.email, u.role, u.can_upload_documents, u.can_use_ai_chat, u.can_manage_faqs, s.expires_at
               FROM sessions s
               JOIN users u ON u.id = s.user_id
               WHERE s.token_hash = %s""",
            (hash_token(raw_token),),
        )
        row = cursor.fetchone()
        cursor.close()
    except mysql.connector.Error:
        return None
    finally:
        if conn:
            conn.close()

    if not row:
        return None
    if row["expires_at"] < datetime.now():
        return None

    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "role": row["role"],
        "isAdmin": row["role"] == "admin",
        "canUploadDocuments": bool(row["can_upload_documents"]),
        "canUseAIChat": bool(row["can_use_ai_chat"]),
        "canManageFAQs": bool(row["can_manage_faqs"]),
    }


def require_admin(request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    if not is_admin_user(user):
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user

def require_permission(request: Request, permission_name: str):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    if is_admin_user(user):
        return user  # admins bypass all individual permission checks
    if not user.get(permission_name):
        raise HTTPException(
            status_code=403,
            detail=f"You don't have permission to use this feature.",
        )
    return user


ensure_users_role_column()


# ---------------------------------------------------------------------------
# REGISTER
# ---------------------------------------------------------------------------
@app.post("/api/register")
def register(payload: RegisterRequest):
    name = payload.name
    email = payload.email.strip().lower()
    password = payload.password
    confirm_password = payload.confirmPassword
    portal = payload.portal.strip().lower() if payload.portal else "user"
    admin_key = payload.adminKey.strip() if payload.adminKey else ""

    if portal not in {"user", "admin"}:
        return error_response({"general": "Invalid registration portal."}, 400)

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

    role = "user"
    if portal == "admin":
        if not ADMIN_REGISTRATION_KEY:
            return error_response(
                {"general": "Admin registration is not configured."},
                500,
            )
        if admin_key != ADMIN_REGISTRATION_KEY:
            return error_response(
                {"general": "Invalid admin registration key."},
                403,
            )
        role = "admin"

    password_hash = bcrypt.hashpw(
        password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (%s, %s, %s, %s)",
            (name.strip(), email, password_hash, role),
        )
        conn.commit()
        cursor.close()
    except mysql.connector.IntegrityError:
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
    portal = payload.portal.strip().lower() if payload.portal else "user"

    if portal not in {"user", "admin"}:
        return error_response({"general": "Invalid login portal."}, 400)

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
            "SELECT id, name, email, role, password_hash, failed_login_attempts, locked_until "
            "FROM users WHERE email = %s",
            (email,),
        )
        user = cursor.fetchone()

        if not user:
            return error_response(
                {"general": "This email is not registered. Please create an account first."},
                404,
            )

        if user["locked_until"] and user["locked_until"] > datetime.now():
            wait_minutes = (
                int((user["locked_until"] - datetime.now()).total_seconds() // 60) + 1
            )
            return error_response(
                {"general": f"Account temporarily locked. Try again in {wait_minutes} minute(s)."},
                423,
            )

        password_ok = bcrypt.checkpw(
            password.encode("utf-8"), user["password_hash"].encode("utf-8")
        )

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
            return error_response({"general": "Invalid email or password."}, 401)

        cursor.execute(
            "UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = %s",
            (user["id"],),
        )
        conn.commit()

        user_is_admin = user["role"] == "admin"
        if portal == "admin" and not user_is_admin:
            cursor.close()
            return error_response(
                {"general": "This account does not have admin access."},
                403,
            )
        if portal == "user" and user_is_admin:
            cursor.close()
            return error_response(
                {"general": "Admin accounts must log in through the admin portal."},
                403,
            )

        # Real, server-verifiable session: store a hash of a fresh token
        # and hand the raw token to the browser as the cookie.
        raw_token = create_session(cursor, conn, user["id"])
        cursor.close()


    except mysql.connector.Error:
        return error_response({"general": "Server error. Please try again."}, 500)
    finally:
        if conn:
            conn.close()

    response = JSONResponse(
        content={
            "success": True,
            "message": "Login successful.",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
                "isAdmin": user_is_admin,
            },
        }
    )
    response.set_cookie(
        key="session_token",
        value=raw_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        path="/",
        max_age=SESSION_MAX_AGE_SECONDS,
    )
    return response


# ---------------------------------------------------------------------------
# LOGOUT
# ---------------------------------------------------------------------------
@app.post("/api/logout")
def logout(request: Request):
    raw_token = request.cookies.get("session_token")
    if raw_token:
        conn = None
        try:
            conn = get_connection()
            cursor = conn.cursor()
            # Invalidate the session server-side, not just the browser cookie —
            # otherwise the same token would still work if replayed elsewhere.
            cursor.execute(
                "DELETE FROM sessions WHERE token_hash = %s",
                (hash_token(raw_token),),
            )
            conn.commit()
            cursor.close()
        except mysql.connector.Error:
            pass  # still clear the cookie below even if this fails
        finally:
            if conn:
                conn.close()

    response = JSONResponse(content={"success": True, "message": "Logged out."})
    response.delete_cookie(
        key="session_token",
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        path="/",
    )
    return response


# ---------------------------------------------------------------------------
# ME — source of truth for "am I actually logged in". Protected pages/APIs
# should call this rather than trusting cookie presence alone (that's what
# middleware.ts does, purely for fast UX redirects, not real security).
# ---------------------------------------------------------------------------
@app.get("/api/me")
def me(request: Request):
    user = get_current_user(request)
    if not user:
        return error_response({"general": "Not authenticated."}, 401)
    return JSONResponse(content={"success": True, "user": user})


# ---------------------------------------------------------------------------
# FAQ CRUD (SQLAlchemy)
# ---------------------------------------------------------------------------
@app.get("/api/faqs", response_model=list[FAQResponse])
def list_faqs(db: Session = Depends(get_db)):
    return db.query(FAQ).order_by(FAQ.created_at.desc(), FAQ.id.desc()).all()


@app.post("/api/faqs", response_model=FAQResponse, status_code=201)
def create_faq(payload: FAQCreate, request: Request, db: Session = Depends(get_db)):
    require_permission(request, "canManageFAQs")
    question = payload.question.strip()
    faq = FAQ(
        question=question,
        answer=payload.answer.strip(),
        embedding=serialize_embedding(embed_text(question)),
    )
    db.add(faq)
    try:
        db.commit()
        db.refresh(faq)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create FAQ.") from exc

    return faq

@app.get("/api/admin/users")
def list_users(request: Request):
    require_admin(request)
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, name, email, role, can_upload_documents, can_use_ai_chat, can_manage_faqs FROM users ORDER BY id DESC"
        )
        users = cursor.fetchall()
        cursor.close()
    except mysql.connector.Error:
        return error_response({"general": "Server error. Please try again."}, 500)
    finally:
        if conn:
            conn.close()

    return JSONResponse(content={"success": True, "users": users})


@app.put("/api/admin/users/{user_id}")
def update_user(user_id: int, payload: AdminUpdateUserRequest, request: Request):
    current_admin = require_admin(request)

    email = payload.email.strip().lower()
    email_error = validate_email(email)
    if email_error:
        return error_response({"email": email_error}, 400)

    if payload.role not in {"user", "admin"}:
        return error_response({"role": "Invalid role."}, 400)

    if current_admin["id"] == user_id and payload.role != "admin":
        return error_response(
            {"general": "You can't remove your own admin access."}, 400
        )

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """UPDATE users
               SET name = %s, email = %s, role = %s,
                   can_upload_documents = %s, can_use_ai_chat = %s, can_manage_faqs = %s
               WHERE id = %s""",
            (
                payload.name.strip(),
                email,
                payload.role,
                payload.can_upload_documents,
                payload.can_use_ai_chat,
                payload.can_manage_faqs,
                user_id,
            ),
        )
        if cursor.rowcount == 0:
            cursor.close()
            raise HTTPException(status_code=404, detail="User not found.")
        conn.commit()
        cursor.close()
    except mysql.connector.IntegrityError:
        return error_response({"email": "An account with this email already exists."}, 409)
    except mysql.connector.Error:
        return error_response({"general": "Server error. Please try again."}, 500)
    finally:
        if conn:
            conn.close()

    return {
        "success": True,
        "message": "User updated successfully.",
        "user": {
            "id": user_id,
            "name": payload.name.strip(),
            "email": email,
            "role": payload.role,
            "can_upload_documents": payload.can_upload_documents,
            "can_use_ai_chat": payload.can_use_ai_chat,
            "can_manage_faqs": payload.can_manage_faqs,
        },
    }
    
@app.delete("/api/admin/users/{user_id}")
def delete_user(user_id: int, request: Request):
    current_admin = require_admin(request)

    if current_admin["id"] == user_id:
        return error_response({"general": "You can't delete your own account."}, 400)

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        if cursor.rowcount == 0:
            cursor.close()
            raise HTTPException(status_code=404, detail="User not found.")
        conn.commit()
        cursor.close()
    except mysql.connector.Error:
        return error_response({"general": "Server error. Please try again."}, 500)
    finally:
        if conn:
            conn.close()

    return {"success": True, "message": "User deleted successfully."}


@app.post("/api/admin/users", status_code=201)
def create_user(payload: AdminCreateUserRequest, request: Request):
    require_admin(request)

    email = payload.email.strip().lower()
    email_error = validate_email(email)
    if email_error:
        return error_response({"email": email_error}, 400)

    if payload.role not in {"user", "admin"}:
        return error_response({"role": "Invalid role."}, 400)

    # Placeholder hash — this can never match a real password check.
    # The user sets their real password via the forgot-password flow.
    placeholder_hash = bcrypt.hashpw(
        secrets.token_urlsafe(32).encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO users
               (name, email, password_hash, role,
                can_upload_documents, can_use_ai_chat, can_manage_faqs)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (
                payload.name.strip(),
                email,
                placeholder_hash,
                payload.role,
                payload.can_upload_documents,
                payload.can_use_ai_chat,
                payload.can_manage_faqs,
            ),
        )
        conn.commit()
        new_id = cursor.lastrowid
        cursor.close()
    except mysql.connector.IntegrityError:
        return error_response({"email": "An account with this email already exists."}, 409)
    except mysql.connector.Error:
        return error_response({"general": "Server error. Please try again."}, 500)
    finally:
        if conn:
            conn.close()

    return {
        "success": True,
        "message": "User created. They can set their password via 'Forgot Password'.",
        "user": {
            "id": new_id,
            "name": payload.name.strip(),
            "email": email,
            "role": payload.role,
            "can_upload_documents": payload.can_upload_documents,
            "can_use_ai_chat": payload.can_use_ai_chat,
            "can_manage_faqs": payload.can_manage_faqs,
        },
    }

#UPDATE FAQ

@app.put("/api/faqs/{faq_id}", response_model=FAQResponse)
def update_faq(
    faq_id: int,
    payload: FAQUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    require_permission(request, "can_manage_faqs")
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found.")

    new_question = payload.question.strip()
    faq.embedding = serialize_embedding(embed_text(new_question))
    faq.question = new_question
    faq.answer = payload.answer.strip()

    try:
        db.commit()
        db.refresh(faq)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update FAQ.") from exc

    return faq

# ---------------------------------------------------------------------------
# DOCUMENT UPLOAD — admin-only. Extracts text, splits into chunks, embeds
# each chunk, and stores everything so /api/ask can search it later.
# ---------------------------------------------------------------------------
@app.post("/api/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    require_permission(request, "canUploadDocuments")

    filename = file.filename or "untitled"
    extension = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if extension not in ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Allowed: PDF, DOCX, XLSX, TXT.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File is too large (max 10MB).")

    try:
        text = extract_text(filename, file_bytes)
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail=f"Could not read file: {exc}"
        ) from exc

    document = Document(filename=filename)
    db.add(document)
    db.flush()  # assigns document.id without committing yet

    qa_pairs = extract_qa_pairs(text)

    if qa_pairs:
        # Structured Q&A content — embed just the question, same as FAQs.
        for index, pair in enumerate(qa_pairs):
            db.add(
                DocumentChunk(
                    document_id=document.id,
                    question=pair["question"],
                    chunk_text=pair["answer"],
                    embedding=serialize_embedding(embed_text(pair["question"])),
                    chunk_index=index,
                )
            )
        piece_count = len(qa_pairs)
    else:
        # Unstructured content — fall back to generic paragraph chunking,
        # embedding each chunk's own content directly.
        pieces = chunk_text(text)
        if not pieces:
            raise HTTPException(
                status_code=400, detail="No readable text found in this file."
            )
        for index, piece in enumerate(pieces):
            db.add(
                DocumentChunk(
                    document_id=document.id,
                    question=None,
                    chunk_text=piece,
                    embedding=serialize_embedding(embed_text(piece)),
                    chunk_index=index,
                )
            )
        piece_count = len(pieces)

    try:
        db.commit()
        db.refresh(document)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to save document.") from exc

    return DocumentResponse(
        id=document.id,
        filename=document.filename,
        uploaded_at=document.uploaded_at,
        chunk_count=piece_count,
    )


# ---------------------------------------------------------------------------
# LIST DOCUMENTS — admin-only, so admins can see what's been uploaded.
# ---------------------------------------------------------------------------
@app.get("/api/documents", response_model=list[DocumentResponse])
def list_documents(request: Request, db: Session = Depends(get_db)):
    require_admin(request)
    documents = db.query(Document).order_by(Document.uploaded_at.desc()).all()
    result = []
    for doc in documents:
        count = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).count()
        result.append(
            DocumentResponse(
                id=doc.id,
                filename=doc.filename,
                uploaded_at=doc.uploaded_at,
                chunk_count=count,
            )
        )
    return result


# ---------------------------------------------------------------------------
# DELETE DOCUMENT — admin-only, removes the document and all its chunks.
# ---------------------------------------------------------------------------
@app.delete("/api/documents/{document_id}")
def delete_document(document_id: int, request: Request, db: Session = Depends(get_db)):
    require_admin(request)
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")

    db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()
    db.delete(document)
    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete document.") from exc

    return {"success": True, "message": "Document deleted successfully."}


# Matching Best Find FAQs

@app.post("/api/ask", response_model=AskResponse)
def ask(payload: AskRequest, db: Session = Depends(get_db)):
    require_permission(request, "can_use_ai_chat")
    if is_greeting(payload.question):
        return AskResponse(answer=GREETING_RESPONSE)

    faqs = db.query(FAQ).all()
    faq_dicts = [
        {"id": f.id, "question": f.question, "answer": f.answer, "embedding": f.embedding}
        for f in faqs
    ]

    chunks = db.query(DocumentChunk).all()
    chunk_dicts = [
    {"question": c.question, "answer": c.chunk_text, "embedding": c.embedding}
    for c in chunks
]
    combined_knowledge = faq_dicts + ABOUT_KNOWLEDGE + chunk_dicts
    match = find_best_match(payload.question, combined_knowledge)

    if not match:
        return AskResponse(
            answer="I don't have information on that yet. Try rephrasing, or check the FAQ page for topics I do know about.",
        )

    return AskResponse(
        answer=match["answer"],
        matched_question=match.get("question"),
        confidence=round(match["score"], 3),
    )

@app.delete("/api/faqs/{faq_id}")
def delete_faq(faq_id: int, request: Request, db: Session = Depends(get_db)):
    require_permission(request, "can_manage_faqs")
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found.")

    db.delete(faq)
    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete FAQ.") from exc

    # TODO: Hook RAG pipeline here (re-embed/remove this FAQ after delete).
    return {"success": True, "message": "FAQ deleted successfully."}


    
# ---------------------------------------------------------------------------
# FORGOT PASSWORD — generate 6-digit PIN and save in DB
# ---------------------------------------------------------------------------
@app.post("/api/forgot-password")
def forgot_password(payload: ForgotPasswordRequest):
    email = payload.email.strip().lower()

    email_error = validate_email(email)
    if email_error:
        return error_response({"email": email_error}, 400)

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Check if email is registered
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            return error_response(
                {"email": "This email is not registered. Please create an account first."},
                404,
            )

        # Generate 6-digit PIN
        pin = str(random.randint(100000, 999999))
        pin_expires = datetime.now() + timedelta(minutes=PIN_EXPIRY_MINUTES)

        # Save PIN and expiry in DB
        cursor.execute(
            "UPDATE users SET reset_pin = %s, reset_pin_expires = %s WHERE email = %s",
            (pin, pin_expires, email),
        )
        conn.commit()
        cursor.close()

    except mysql.connector.Error:
        return error_response({"general": "Server error. Please try again."}, 500)
    finally:
        if conn:
            conn.close()

    # In production: send pin via email/SMS. For now return in response for testing.
    return JSONResponse(
        content={
            "success": True,
            "message": "Verification code generated.", # REMOVE THIS IN PRODUCTION
        }
    )


# ---------------------------------------------------------------------------
# VERIFY CODE — check 6-digit PIN against DB
# ---------------------------------------------------------------------------
@app.post("/api/verify-code")
def verify_code(payload: VerifyCodeRequest):
    email = payload.email.strip().lower()
    code = payload.code.strip()

    if not email or not code:
        return error_response({"general": "Email and code are required."}, 400)

    if len(code) != 6 or not code.isdigit():
        return error_response({"general": "Code must be a 6-digit number."}, 400)

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT reset_pin, reset_pin_expires FROM users WHERE email = %s",
            (email,),
        )
        user = cursor.fetchone()
        cursor.close()

    except mysql.connector.Error:
        return error_response({"general": "Server error. Please try again."}, 500)
    finally:
        if conn:
            conn.close()

    if not user or not user["reset_pin"]:
        return error_response({"general": "No code found. Please request a new one."}, 404)

    if user["reset_pin_expires"] < datetime.now():
        return error_response({"general": "Code has expired. Please request a new one."}, 410)

    if user["reset_pin"] != code:
        return error_response({"general": "Incorrect code. Please try again."}, 401)

    return JSONResponse(content={"success": True, "message": "Code verified."})


# ---------------------------------------------------------------------------
# UPDATE PASSWORD — hash new password, clear PIN from DB
# ---------------------------------------------------------------------------
@app.post("/api/update-password")
def update_password(payload: UpdatePasswordRequest):
    email = payload.email.strip().lower()
    password = payload.password
    confirm_password = payload.confirmPassword

    errors = {}
    password_error = validate_password(password)
    if password_error:
        errors["password"] = password_error

    if not confirm_password.strip():
        errors["confirmPassword"] = "Please confirm your password."
    elif password != confirm_password:
        errors["confirmPassword"] = "Passwords do not match."

    if errors:
        return error_response(errors, 400)

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Verify the user still has a valid verified pin session
        cursor.execute(
            "SELECT id, reset_pin, reset_pin_expires FROM users WHERE email = %s",
            (email,),
        )
        user = cursor.fetchone()

        if not user or not user["reset_pin"]:
            return error_response(
                {"general": "Session expired. Please start the forgot password process again."},
                403,
            )

        if user["reset_pin_expires"] < datetime.now():
            return error_response(
                {"general": "Session expired. Please start the forgot password process again."},
                410,
            )

        # Hash new password
        new_hash = bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

        # Update password AND clear PIN (CRITICAL: PIN must be cleared so it cannot be reused)
        cursor.execute(
            """UPDATE users
               SET password_hash = %s,
                   reset_pin = NULL,
                   reset_pin_expires = NULL,
                   failed_login_attempts = 0,
                   locked_until = NULL
               WHERE email = %s""",
            (new_hash, email),
        )
        conn.commit()
        cursor.close()

    except mysql.connector.Error:
        return error_response({"general": "Server error. Please try again."}, 500)
    finally:
        if conn:
            conn.close()

    return JSONResponse(
        content={"success": True, "message": "Password updated successfully."}
    )
