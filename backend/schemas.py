from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# Base schema with strict validation and forbidding extra unknown fields
class StrictBaseModel(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        strict=True,
        validate_assignment=True
    )

# --- Authentication Schemas ---
class LoginRequest(StrictBaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    device_mode: str = Field(default="REGISTERED", pattern="^(REGISTERED|UNKNOWN)$")

class UserSummary(StrictBaseModel):
    id: str
    name: str
    email: str
    role: str
    registered_device_id: Optional[str] = None

class LoginResponse(StrictBaseModel):
    success: bool
    user: UserSummary
    demo_otp: str
    expires_at: str

class OtpVerifyRequest(StrictBaseModel):
    user_id: str = Field(..., min_length=10, max_length=64)
    otp: str = Field(..., min_length=6, max_length=6, pattern="^[0-9]{6}$")
    device_mode: str = Field(default="REGISTERED", pattern="^(REGISTERED|UNKNOWN)$")
    ip_address: str = Field(default="192.168.1.100")

class TokenResponse(StrictBaseModel):
    success: bool
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in_minutes: int
    session_id: str
    device_id: str
    user: UserSummary

class TokenRefreshRequest(StrictBaseModel):
    refresh_token: str

class LogoutRequest(StrictBaseModel):
    session_id: str

# --- Question Schemas ---
class QuestionCreateRequest(StrictBaseModel):
    id: Optional[str] = Field(None, max_length=50)
    subject: str = Field(..., min_length=2, max_length=100)
    topic: str = Field(..., min_length=2, max_length=100)
    difficulty: str = Field(default="MEDIUM", pattern="^(EASY|MEDIUM|HARD)$")
    question_text: str = Field(..., min_length=5)
    options: List[str] = Field(..., min_length=2, max_length=10)
    correct_answer: str = Field(..., min_length=1)

class QuestionUpdateRequest(StrictBaseModel):
    subject: Optional[str] = Field(None, min_length=2, max_length=100)
    topic: Optional[str] = Field(None, min_length=2, max_length=100)
    difficulty: Optional[str] = Field(None, pattern="^(EASY|MEDIUM|HARD)$")
    question_text: Optional[str] = Field(None, min_length=5)
    options: Optional[List[str]] = Field(None, min_length=2, max_length=10)
    correct_answer: Optional[str] = Field(None, min_length=1)

class QuestionResponse(StrictBaseModel):
    id: str
    author_id: str
    subject: str
    topic: str
    difficulty: str
    question_text: str  # Decrypted for authorized client
    options: List[str]
    correct_answer: str # Decrypted for authorized client
    status: str
    version: int
    created_at: str
    updated_at: str

# --- Security / Risk & Lockdown Schemas ---
class RiskEventSimulationRequest(StrictBaseModel):
    session_id: str
    rule_name: str = Field(..., min_length=3, max_length=100)
    points: int = Field(..., ge=1, le=100)
    reason: str = Field(..., min_length=3, max_length=255)
    metadata: Optional[Dict[str, Any]] = None

class LockdownTriggerRequest(StrictBaseModel):
    reason: str = Field(..., min_length=5, max_length=500)
    is_pre_warning: bool = False

class LockdownLiftRequest(StrictBaseModel):
    justification: str = Field(..., min_length=5, max_length=500)

class SessionReinstateRequest(StrictBaseModel):
    session_id: str
    admin_note: str = Field(..., min_length=5, max_length=500)
