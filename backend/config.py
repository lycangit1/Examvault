import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env explicitly from backend directory
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    PORT: int = int(os.getenv("PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./examvault_hardened.db")
    
    # JWT Secrets & Configuration
    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY", 
        "examvault_hardened_super_secure_jwt_signing_key_secret_2026_x89a1"
    )
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # Field-Level Fernet Symmetric Key (AES-128-CBC + HMAC-SHA256)
    FERNET_ENCRYPTION_KEY: str = os.getenv(
        "FERNET_ENCRYPTION_KEY", 
        "gK7mR9yX_2pZbF3eW1uV8nQ0tI6oA5sL4jC8vD2xM1w="
    )
    
    # Security Thresholds
    RATE_LIMIT_MAX_ATTEMPTS: int = int(os.getenv("RATE_LIMIT_MAX_ATTEMPTS", "5"))
    RATE_LIMIT_WINDOW_MINUTES: int = int(os.getenv("RATE_LIMIT_WINDOW_MINUTES", "10"))
    RATE_LIMIT_LOCKOUT_MINUTES: int = int(os.getenv("RATE_LIMIT_LOCKOUT_MINUTES", "5"))
    SESSION_IDLE_TIMEOUT_MINUTES: int = int(os.getenv("SESSION_IDLE_TIMEOUT_MINUTES", "15"))
    MAX_UPLOAD_SIZE_BYTES: int = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", "10485760")) # 10MB

settings = Settings()
