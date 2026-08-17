"""
schemas.py
Pydantic request/response models.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RegisterRequest(BaseModel):
    name: str = ""
    email: str = ""
    password: str = ""
    confirmPassword: str = ""
    portal: str = "user"
    adminKey: str = ""


class LoginRequest(BaseModel):
    email: str = ""
    password: str = ""
    portal: str = "user"


class ForgotPasswordRequest(BaseModel):
    email: str = ""


class VerifyCodeRequest(BaseModel):
    email: str = ""
    code: str = ""


class UpdatePasswordRequest(BaseModel):
    email: str = ""
    password: str = ""
    confirmPassword: str = ""


class FAQBase(BaseModel):
    question: str = Field(min_length=1)
    answer: str = Field(min_length=1)


class FAQCreate(FAQBase):
    pass


class FAQUpdate(FAQBase):
    pass


class FAQResponse(FAQBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1)


class AskResponse(BaseModel):
    answer: str
    matched_question: str | None = None
    confidence: float | None = None
    
class DocumentResponse(BaseModel):
    id: int
    filename: str
    uploaded_at: datetime | None = None
    chunk_count: int

    model_config = ConfigDict(from_attributes=True)    
    
class AdminCreateUserRequest(BaseModel):
    name: str
    email: str
    role: str = "user"
    can_upload_documents: bool = False
    can_use_ai_chat: bool = True
    can_manage_faqs: bool = False


class AdminUpdateUserRequest(BaseModel):
    name: str
    email: str
    role: str
    can_upload_documents: bool
    can_use_ai_chat: bool
    can_manage_faqs: bool
