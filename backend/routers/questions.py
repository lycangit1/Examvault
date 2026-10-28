import random
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Question, QuestionVersion, AppSession
from backend.schemas import QuestionCreateRequest, QuestionUpdateRequest, QuestionResponse
from backend.security.jwt import get_current_user
from backend.security.encryption import encrypt_field, decrypt_field
from backend.security.session_tracker import session_tracker

router = APIRouter(prefix="/questions", tags=["Questions"])

def require_active_session(current_user: dict = Depends(get_current_user)):
    """
    Middleware dependency that enforces the 15-minute idle timeout on every API request.
    """
    session_id = current_user.get("session_id")
    session_tracker.validate_session_active(session_id)
    return current_user

def seed_demo_questions_if_empty(db: Session):
    """
    Seeds initial encrypted demonstration questions if the questions table is empty.
    """
    if db.query(Question).count() == 0:
        now = datetime.now(timezone.utc)
        demo_qs = [
            Question(
                id="Q-108",
                author_id="11111111-1111-1111-1111-111111111111",
                subject="Physics",
                topic="Wave Optics",
                difficulty="HARD",
                question_text=encrypt_field("In a Young double slit experiment, if slit separation is halved and screen distance is doubled, what is the change in fringe width?"),
                options=[
                    "Fringe width remains unchanged",
                    "Fringe width becomes 4 times original value",
                    "Fringe width is halved",
                    "Fringe width is doubled"
                ],
                correct_answer=encrypt_field("Fringe width becomes 4 times original value"),
                status="APPROVED",
                version=1,
                created_at=now,
                updated_at=now
            ),
            Question(
                id="Q-103",
                author_id="11111111-1111-1111-1111-111111111111",
                subject="Physics",
                topic="Electromagnetic Induction",
                difficulty="MEDIUM",
                question_text=encrypt_field("When a north pole of a bar magnet moves into a stationary coil, what is the direction of induced current viewed from the approaching side?"),
                options=[
                    "Clockwise direction",
                    "Anti-clockwise direction",
                    "Zero induced current",
                    "Alternating without steady direction"
                ],
                correct_answer=encrypt_field("Anti-clockwise direction"),
                status="APPROVED",
                version=1,
                created_at=now,
                updated_at=now
            ),
            Question(
                id="Q-101",
                author_id="11111111-1111-1111-1111-111111111111",
                subject="Physics",
                topic="Kinematics",
                difficulty="EASY",
                question_text=encrypt_field("A car increases its velocity from 10 m/s to 30 m/s in 5 seconds with uniform acceleration. What is its displacement during this period?"),
                options=[
                    "50 meters",
                    "100 meters",
                    "150 meters",
                    "200 meters"
                ],
                correct_answer=encrypt_field("100 meters"),
                status="APPROVED",
                version=1,
                created_at=now,
                updated_at=now
            ),
        ]
        db.add_all(demo_qs)
        db.commit()

@router.post("/", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def create_question(
    q_in: QuestionCreateRequest,
    current_user: dict = Depends(require_active_session),
    db: Session = Depends(get_db)
):
    # Enforce RBAC: Only SETTER or INVESTIGATOR can create questions
    if current_user.get("role") not in ["SETTER", "INVESTIGATOR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only SETTER role can author new questions."
        )

    q_id = q_in.id or f"Q-{random.randint(100, 999)}"
    
    # 1. Encrypt Sensitive Fields using Fernet (AES-128-CBC + HMAC-SHA256)
    encrypted_text = encrypt_field(q_in.question_text)
    encrypted_answer = encrypt_field(q_in.correct_answer)

    now = datetime.now(timezone.utc)
    new_q = Question(
        id=q_id,
        author_id=current_user["sub"],
        subject=q_in.subject,
        topic=q_in.topic,
        difficulty=q_in.difficulty,
        question_text=encrypted_text,     # Ciphertext in Database
        options=q_in.options,
        correct_answer=encrypted_answer,   # Ciphertext in Database
        status="DRAFT",
        version=1,
        created_at=now,
        updated_at=now
    )
    
    # Create initial version snapshot
    v1 = QuestionVersion(
        question_id=q_id,
        version_number=1,
        question_text=encrypted_text,
        correct_answer=encrypted_answer,
        options=q_in.options,
        changed_by=current_user["sub"],
        created_at=now
    )
    
    db.add(new_q)
    db.add(v1)
    db.commit()
    db.refresh(new_q)

    # Decrypt transparently for response
    return QuestionResponse(
        id=new_q.id,
        author_id=new_q.author_id,
        subject=new_q.subject,
        topic=new_q.topic,
        difficulty=new_q.difficulty,
        question_text=decrypt_field(new_q.question_text),
        options=new_q.options,
        correct_answer=decrypt_field(new_q.correct_answer),
        status=new_q.status,
        version=new_q.version,
        created_at=new_q.created_at.isoformat(),
        updated_at=new_q.updated_at.isoformat()
    )

@router.get("/", response_model=List[QuestionResponse])
def list_questions(
    current_user: dict = Depends(require_active_session),
    db: Session = Depends(get_db)
):
    questions = db.query(Question).order_by(Question.created_at.desc()).all()
    
    # Return decrypted representations
    return [
        QuestionResponse(
            id=q.id,
            author_id=q.author_id,
            subject=q.subject,
            topic=q.topic,
            difficulty=q.difficulty,
            question_text=decrypt_field(q.question_text),
            options=q.options,
            correct_answer=decrypt_field(q.correct_answer),
            status=q.status,
            version=q.version,
            created_at=q.created_at.isoformat(),
            updated_at=q.updated_at.isoformat()
        )
        for q in questions
    ]

@router.get("/{question_id}", response_model=QuestionResponse)
def get_question(
    question_id: str,
    current_user: dict = Depends(require_active_session),
    db: Session = Depends(get_db)
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")

    return QuestionResponse(
        id=q.id,
        author_id=q.author_id,
        subject=q.subject,
        topic=q.topic,
        difficulty=q.difficulty,
        question_text=decrypt_field(q.question_text),
        options=q.options,
        correct_answer=decrypt_field(q.correct_answer),
        status=q.status,
        version=q.version,
        created_at=q.created_at.isoformat(),
        updated_at=q.updated_at.isoformat()
    )
