import os
import io
import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient

# Ensure test database path
os.environ["DATABASE_URL"] = "sqlite:///./test_examvault_hardened.db"
os.environ["FERNET_ENCRYPTION_KEY"] = "gK7mR9yX_2pZbF3eW1uV8nQ0tI6oA5sL4jC8vD2xM1w="

from backend.main import app
from backend.database import engine, Base, SessionLocal
from backend.models import User, Question, AppSession
from backend.security.encryption import encrypt_field, decrypt_field
from backend.security.rate_limiter import auth_rate_limiter
from backend.security.session_tracker import session_tracker

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_examvault_hardened.db"):
        try:
            os.remove("./test_examvault_hardened.db")
        except Exception:
            pass

# --- 1. Pydantic Strict Validation Tests ---
def test_pydantic_strict_validation_rejects_extra_fields():
    # Attempt login with unexpected extra field 'injected_hack'
    response = client.post("/auth/login", json={
        "email": "setter_a@examvault.com",
        "password": "password123",
        "device_mode": "REGISTERED",
        "injected_hack": "malicious_payload" # Should be rejected with 422
    })
    assert response.status_code == 422
    data = response.json()
    assert data["error"] == "SCHEMA_VALIDATION_FAILED"
    assert any(err["loc"][-1] == "injected_hack" for err in data["details"])

# --- 2. Rate Limiting Tests (5 failed attempts -> 5-min lockout) ---
def test_rate_limiting_locks_out_after_5_failed_attempts():
    target_email = "brute_force_target@examvault.com"
    auth_rate_limiter.failures.pop(target_email, None)
    auth_rate_limiter.lockouts.pop(target_email, None)

    # 4 failed attempts
    for i in range(4):
        res = client.post("/auth/login", json={
            "email": target_email,
            "password": "wrong_password_attempt",
            "device_mode": "REGISTERED"
        })
        assert res.status_code == 401

    # 5th failed attempt -> Triggers lockout
    res5 = client.post("/auth/login", json={
        "email": target_email,
        "password": "wrong_password_attempt",
        "device_mode": "REGISTERED"
    })
    assert res5.status_code == 429
    data = res5.json()
    assert "RATE_LIMIT_TRIGGERED" in str(data)

    # 6th attempt while locked out is immediately rejected with 429
    res6 = client.post("/auth/login", json={
        "email": target_email,
        "password": "password123",
        "device_mode": "REGISTERED"
    })
    assert res6.status_code == 429

# --- 3. JWT Lifecycle & Token Refresh without OTP ---
def test_jwt_lifecycle_and_token_refresh():
    # Login to obtain OTP
    login_res = client.post("/auth/login", json={
        "email": "setter_a@examvault.com",
        "password": "password123",
        "device_mode": "REGISTERED"
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    user_id = login_data["user"]["id"]
    otp = login_data["demo_otp"]

    # Verify OTP to get Access and Refresh tokens
    verify_res = client.post("/auth/otp-verify", json={
        "user_id": user_id,
        "otp": otp,
        "device_mode": "REGISTERED",
        "ip_address": "192.168.1.100"
    })
    assert verify_res.status_code == 200
    token_data = verify_res.json()
    access_token = token_data["access_token"]
    refresh_token = token_data["refresh_token"]
    assert token_data["expires_in_minutes"] == 30
    assert access_token is not None
    assert refresh_token is not None

    # Use refresh token to obtain a fresh access token without re-entering OTP
    refresh_res = client.post("/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert refresh_res.status_code == 200
    refreshed_data = refresh_res.json()
    assert refreshed_data["access_token"] is not None
    assert refreshed_data["access_token"] != access_token

# --- 4. Fernet Field-Level Encryption Tests ---
def test_field_level_fernet_encryption_roundtrip():
    raw_question = "What is the primary objective of cryptographic hash chaining?"
    raw_answer = "To provide an immutable, tamper-evident audit record."

    # Encrypt
    encrypted_q = encrypt_field(raw_question)
    encrypted_a = encrypt_field(raw_answer)

    # Verify ciphertext differs from plaintext and contains Fernet signature
    assert encrypted_q != raw_question
    assert encrypted_a != raw_answer
    assert encrypted_q.startswith("gAAAAA")

    # Decrypt
    decrypted_q = decrypt_field(encrypted_q)
    decrypted_a = decrypt_field(encrypted_a)

    assert decrypted_q == raw_question
    assert decrypted_a == raw_answer

def test_questions_api_stores_ciphertext_in_db():
    # Login as Setter
    login_res = client.post("/auth/login", json={
        "email": "setter_a@examvault.com",
        "password": "password123",
        "device_mode": "REGISTERED"
    })
    user_id = login_res.json()["user"]["id"]
    otp = login_res.json()["demo_otp"]
    verify_res = client.post("/auth/otp-verify", json={
        "user_id": user_id,
        "otp": otp,
        "device_mode": "REGISTERED"
    })
    access_token = verify_res.json()["access_token"]

    # Create Question via API
    secret_text = "CONFIDENTIAL QUESTION TEXT: Quantum Key Distribution protocol"
    secret_answer = "BB84 protocol with entangled photon pairs"
    
    create_res = client.post(
        "/questions/",
        json={
            "id": "Q-SEC-99",
            "subject": "Quantum Computing",
            "topic": "Cryptography",
            "difficulty": "HARD",
            "question_text": secret_text,
            "options": ["BB84", "RSA", "ECC", "AES"],
            "correct_answer": secret_answer
        },
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert create_res.status_code == 201
    res_data = create_res.json()
    assert res_data["question_text"] == secret_text # Decrypted for authorized client

    # Inspect raw database row to prove it is stored as CIPHERTEXT
    db = SessionLocal()
    raw_row = db.query(Question).filter(Question.id == "Q-SEC-99").first()
    assert raw_row.question_text != secret_text
    assert raw_row.question_text.startswith("gAAAAA")
    assert raw_row.correct_answer != secret_answer
    assert raw_row.correct_answer.startswith("gAAAAA")
    db.close()

# --- 5. Session Idle-Timeout Test (15-min rule) ---
def test_session_idle_timeout_expires_session():
    # Create authenticated session
    login_res = client.post("/auth/login", json={
        "email": "setter_a@examvault.com",
        "password": "password123",
        "device_mode": "REGISTERED"
    })
    user_id = login_res.json()["user"]["id"]
    otp = login_res.json()["demo_otp"]
    verify_res = client.post("/auth/otp-verify", json={
        "user_id": user_id,
        "otp": otp,
        "device_mode": "REGISTERED"
    })
    access_token = verify_res.json()["access_token"]
    session_id = verify_res.json()["session_id"]

    # Verify active access works
    q_res = client.get("/questions/", headers={"Authorization": f"Bearer {access_token}"})
    assert q_res.status_code == 200

    # Simulate 16 minutes of inactivity
    session_tracker.last_activity[session_id] = datetime.now(timezone.utc) - timedelta(minutes=16)

    # Next request should be rejected with 401 SESSION_EXPIRED
    expired_res = client.get("/questions/", headers={"Authorization": f"Bearer {access_token}"})
    assert expired_res.status_code == 401
    assert "SESSION_EXPIRED" in str(expired_res.json())

# --- 6. Content-Based File Upload Validation (Magic Bytes) ---
def test_leak_upload_validates_magic_bytes():
    # Login as Investigator
    login_res = client.post("/auth/login", json={
        "email": "investigator@examvault.com",
        "password": "password123",
        "device_mode": "REGISTERED"
    })
    user_id = login_res.json()["user"]["id"]
    otp = login_res.json()["demo_otp"]
    verify_res = client.post("/auth/otp-verify", json={
        "user_id": user_id,
        "otp": otp,
        "device_mode": "REGISTERED"
    })
    access_token = verify_res.json()["access_token"]

    # 1. Valid Authentic PNG file (starts with PNG header \x89PNG\r\n\x1a\n)
    valid_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    png_res = client.post(
        "/investigator/leaks/upload",
        files={"file": ("screenshot.png", io.BytesIO(valid_png), "image/png")},
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert png_res.status_code == 200
    assert png_res.json()["mime_type"] == "image/png"

    # 2. Spoofed File: Malicious EXE renamed as "screenshot.png"
    fake_png = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00This is a Windows PE executable"
    spoofed_res = client.post(
        "/investigator/leaks/upload",
        files={"file": ("screenshot.png", io.BytesIO(fake_png), "image/png")},
        headers={"Authorization": f"Bearer {access_token}"}
    )
    # Must be rejected because magic bytes do not match PNG/JPEG/PDF
    assert spoofed_res.status_code == 400
    assert "Invalid file format" in spoofed_res.json()["detail"]
