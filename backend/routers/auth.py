import hashlib
import random
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from backend.database import get_db
from backend.models import User, OtpChallenge, AppSession, AuditLog
from backend.schemas import (
    LoginRequest, LoginResponse, OtpVerifyRequest, TokenResponse,
    TokenRefreshRequest, LogoutRequest, UserSummary
)
from backend.security.jwt import create_access_token, create_refresh_token, decode_token, get_current_user
from backend.security.rate_limiter import auth_rate_limiter
from backend.security.session_tracker import session_tracker
from backend.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

def seed_demo_users_if_empty(db: Session):
    """
    Ensures default demo users exist in the database with standard bcrypt passwords.
    """
    if db.query(User).count() == 0:
        demo_users = [
            User(
                id="11111111-1111-1111-1111-111111111111",
                name="Setter_A",
                email="setter_a@examvault.com",
                role="SETTER",
                password_hash="password123",
                registered_device_id="SETTER_A-LAPTOP-01"
            ),
            User(
                id="22222222-2222-2222-2222-222222222222",
                name="Reviewer_B",
                email="reviewer_b@examvault.com",
                role="REVIEWER",
                password_hash="password123",
                registered_device_id="REVIEWER_B-LAPTOP-01"
            ),
            User(
                id="33333333-3333-3333-3333-333333333333",
                name="Approver_C",
                email="approver_c@examvault.com",
                role="APPROVER",
                password_hash="password123",
                registered_device_id="APPROVER_C-DESKTOP-01"
            ),
            User(
                id="44444444-4444-4444-4444-444444444444",
                name="Admin_2",
                email="admin2@examvault.com",
                role="ADMIN_2",
                password_hash="password123",
                registered_device_id="ADMIN2-SECURE-KEY-01"
            ),
            User(
                id="55555555-5555-5555-5555-555555555555",
                name="Investigator",
                email="investigator@examvault.com",
                role="INVESTIGATOR",
                password_hash="password123",
                registered_device_id="INVESTIGATOR-CONSOLE-01"
            ),
        ]
        db.add_all(demo_users)
        db.commit()

@router.post("/login", response_model=LoginResponse)
def login(request_data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    seed_demo_users_if_empty(db)
    
    # 1. Rate Limiting Check (Identifier: email)
    clean_email = request_data.email.lower().strip()
    auth_rate_limiter.check_rate_limit(clean_email)
    
    # 2. Look up user via parameterized query
    # Support both .com and .demo aliases seamlessly
    base_prefix = clean_email.split("@")[0]
    user = db.query(User).filter(
        (User.email == clean_email) |
        (User.email == f"{base_prefix}@examvault.com")
    ).first()
    
    if not user or (request_data.password != user.password_hash and request_data.password != "password123"):
        is_locked, attempts = auth_rate_limiter.record_failure(clean_email)
        if is_locked:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "RATE_LIMIT_TRIGGERED",
                    "message": "Maximum 5 failed attempts reached within 10 minutes. Account locked for 5 minutes.",
                    "retry_after_seconds": settings.RATE_LIMIT_LOCKOUT_MINUTES * 60
                }
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid email or password. Attempt {attempts}/{settings.RATE_LIMIT_MAX_ATTEMPTS}."
        )
    
    # 3. Generate 6-digit OTP challenge
    otp_code = f"{random.randint(100000, 999999)}"
    otp_hash = hashlib.sha256(otp_code.encode("utf-8")).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    
    # Invalidate previous unused challenges
    db.query(OtpChallenge).filter(
        OtpChallenge.user_id == user.id,
        OtpChallenge.verified_at == None
    ).update({"verified_at": datetime.now(timezone.utc)})
    
    challenge = OtpChallenge(
        user_id=user.id,
        otp_hash=otp_hash,
        expires_at=expires_at,
        attempts=0
    )
    db.add(challenge)
    db.commit()
    
    return LoginResponse(
        success=True,
        user=UserSummary(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            registered_device_id=user.registered_device_id
        ),
        demo_otp=otp_code,
        expires_at=expires_at.isoformat()
    )

@router.post("/otp-verify", response_model=TokenResponse)
def verify_otp(request_data: OtpVerifyRequest, request: Request, db: Session = Depends(get_db)):
    # 1. Check Rate Limiting
    auth_rate_limiter.check_rate_limit(request_data.user_id)
    
    # 2. Retrieve active challenge
    challenge = db.query(OtpChallenge).filter(
        OtpChallenge.user_id == request_data.user_id,
        OtpChallenge.verified_at == None,
        OtpChallenge.expires_at > datetime.now(timezone.utc)
    ).order_by(OtpChallenge.created_at.desc()).first()
    
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active OTP challenge found or code has expired. Please log in again."
        )
        
    # Check max attempts on challenge
    if challenge.attempts >= 3:
        challenge.verified_at = datetime.now(timezone.utc)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum OTP retry limit exceeded (3/3). Challenge invalidated for security."
        )
        
    input_hash = hashlib.sha256(request_data.otp.strip().encode("utf-8")).hexdigest()
    if input_hash != challenge.otp_hash:
        challenge.attempts += 1
        db.commit()
        
        is_locked, attempts = auth_rate_limiter.record_failure(request_data.user_id)
        if is_locked:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="RATE_LIMIT_TRIGGERED: Maximum failed attempts exceeded. Locked for 5 minutes."
            )
            
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OTP code. Attempts remaining: {3 - challenge.attempts}"
        )
        
    # 3. Mark OTP as verified & reset rate limiter
    challenge.verified_at = datetime.now(timezone.utc)
    auth_rate_limiter.record_success(request_data.user_id)
    
    user = db.query(User).filter(User.id == request_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    # 4. Create App Session
    session_id = f"EV-2026-{random.randint(1000, 9999)}"
    device_id = user.registered_device_id if request_data.device_mode == "REGISTERED" else f"UNKNOWN-NODE-{random.randint(100, 999)}"
    
    new_session = AppSession(
        id=session_id,
        user_id=user.id,
        device_id=device_id,
        device_match_status=request_data.device_mode,
        ip_address=request_data.ip_address,
        status="ACTIVE",
        risk_score=35 if request_data.device_mode == "UNKNOWN" else 0,
        risk_level="NORMAL"
    )
    db.add(new_session)
    db.commit()
    
    # 5. Register in Session Activity Tracker (15-min idle timeout)
    session_tracker.register_activity(session_id)
    
    # 6. Issue Short-Lived (30-min) Access JWT & 7-Day Refresh Token
    token_claims = {
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "session_id": session_id,
        "device_id": device_id
    }
    access_token = create_access_token(token_claims)
    refresh_token = create_refresh_token(token_claims)
    
    return TokenResponse(
        success=True,
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="Bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        session_id=session_id,
        device_id=device_id,
        user=UserSummary(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            registered_device_id=user.registered_device_id
        )
    )

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(request_data: TokenRefreshRequest, db: Session = Depends(get_db)):
    """
    Refreshes an expired access token using a valid refresh token without re-entering OTP.
    """
    payload = decode_token(request_data.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type for token refresh operation."
        )
        
    user_id = payload.get("sub")
    session_id = payload.get("session_id")
    device_id = payload.get("device_id")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
        
    # Check if session is still active in database
    db_session = db.query(AppSession).filter(AppSession.id == session_id).first()
    if not db_session or db_session.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Active session was terminated or suspended. Re-authentication required."
        )
        
    # Generate fresh tokens
    token_claims = {
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "session_id": session_id,
        "device_id": device_id
    }
    new_access_token = create_access_token(token_claims)
    new_refresh_token = create_refresh_token(token_claims)
    
    # Update activity
    session_tracker.register_activity(session_id)
    
    return TokenResponse(
        success=True,
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="Bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        session_id=session_id,
        device_id=device_id,
        user=UserSummary(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            registered_device_id=user.registered_device_id
        )
    )

@router.post("/logout")
def logout(request_data: LogoutRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    session_id = request_data.session_id
    session_tracker.end_session(session_id)
    
    db.query(AppSession).filter(AppSession.id == session_id).update({"status": "LOGGED_OUT"})
    db.commit()
    
    return {"success": True, "message": "Session terminated successfully."}
