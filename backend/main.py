from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from backend.config import settings
from backend.database import engine, Base
from backend.routers.auth import router as auth_router
from backend.routers.questions import router as questions_router
from backend.routers.leaks import router as leaks_router

# 1. Create database schema tables via SQLAlchemy ORM
Base.metadata.create_all(bind=engine)

# 2. Initialize FastAPI application with OpenAPI metadata
app = FastAPI(
    title="ExamVault Hardened Core API",
    description="Defense-in-depth, least-privilege FastAPI backend for ExamVault with field-level Fernet encryption, sliding-window rate limiting, and strict schema enforcement.",
    version="1.0.0"
)

# 3. CORS Hardening
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 4. Strict Validation Error Handling (Reject extra or mismatched fields)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "SCHEMA_VALIDATION_FAILED",
            "message": "Request body failed strict type validation or contained prohibited unexpected fields.",
            "details": exc.errors()
        }
    )

# 5. Include API Routers
app.include_router(auth_router)
app.include_router(questions_router)
app.include_router(leaks_router)

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "environment": settings.ENVIRONMENT,
        "security": {
            "pydantic_strict": True,
            "sqlalchemy_orm": True,
            "fernet_encryption": True,
            "jwt_expiry_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            "rate_limiting_active": True,
            "session_idle_timeout_minutes": settings.SESSION_IDLE_TIMEOUT_MINUTES
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
