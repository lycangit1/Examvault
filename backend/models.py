import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Text, JSON, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from backend.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    role = Column(String(50), nullable=False, default="SETTER")
    password_hash = Column(String(255), nullable=False)
    registered_device_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class OtpChallenge(Base):
    __tablename__ = "otp_challenges"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    otp_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AppSession(Base):
    __tablename__ = "app_sessions"

    id = Column(String(100), primary_key=True) # e.g. EV-2026-XXXX
    user_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    device_id = Column(String(100), nullable=False)
    device_match_status = Column(String(50), default="REGISTERED")
    ip_address = Column(String(50), default="192.168.1.100")
    status = Column(String(50), default="ACTIVE") # ACTIVE, SUSPENDED, LOGGED_OUT
    risk_score = Column(Integer, default=0)
    risk_level = Column(String(50), default="NORMAL") # NORMAL, UNDER_WATCH, HIGH_RISK
    face_verified = Column(Boolean, default=True)
    login_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    suspended_at = Column(DateTime, nullable=True)
    reinstated_at = Column(DateTime, nullable=True)
    admin_reinstatement_note = Column(Text, nullable=True)

class Question(Base):
    __tablename__ = "questions"

    id = Column(String(50), primary_key=True) # e.g. Q-101
    author_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    subject = Column(String(100), nullable=False)
    topic = Column(String(100), nullable=False)
    difficulty = Column(String(50), default="MEDIUM")
    
    # Encrypted Field-Level Sensitive Data (Fernet AES-128-CBC + HMAC-SHA256)
    question_text = Column(Text, nullable=False)
    correct_answer = Column(Text, nullable=False)
    
    options = Column(JSON, nullable=False) # JSON list of option strings
    status = Column(String(50), default="DRAFT") # DRAFT, SUBMITTED_FOR_REVIEW, APPROVED, REJECTED, LOCKED
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class QuestionVersion(Base):
    __tablename__ = "question_versions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    question_id = Column(String(50), ForeignKey("questions.id"), index=True, nullable=False)
    version_number = Column(Integer, nullable=False)
    
    # Encrypted Field-Level Sensitive Data
    question_text = Column(Text, nullable=False)
    correct_answer = Column(Text, nullable=False)
    
    options = Column(JSON, nullable=False)
    changed_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), nullable=True)
    role = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(String(100), nullable=True)
    session_id = Column(String(100), nullable=True)
    device_id = Column(String(100), nullable=True)
    ip_address = Column(String(50), nullable=True)
    risk_score = Column(Integer, default=0)
    previous_hash = Column(String(64), nullable=False)
    current_hash = Column(String(64), nullable=False)
    extra_metadata = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class LeakReport(Base):
    __tablename__ = "leak_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    reported_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    extracted_token = Column(String(100), nullable=True)
    status = Column(String(50), default="PROCESSED")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
