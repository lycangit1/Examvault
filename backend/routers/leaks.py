from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import LeakReport
from backend.security.jwt import get_current_user
from backend.security.file_validator import validate_uploaded_file

router = APIRouter(prefix="/investigator/leaks", tags=["Leak Investigation"])

@router.post("/upload")
async def upload_leak_evidence(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Enforce RBAC: Investigator role only
    if current_user.get("role") != "INVESTIGATOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only Investigator role can submit leak evidence."
        )

    # 1. Content-based server-side file inspection (magic bytes & max 10MB size)
    file_bytes, detected_mime = await validate_uploaded_file(file)

    # 2. Extract simulated watermark token
    extracted_token = "EV-1042" if b"EV-1042" in file_bytes or "leak" in (file.filename or "").lower() else "EV-2026-UNKNOWN"

    report = LeakReport(
        reported_by=current_user["sub"],
        filename=file.filename or "evidence.dat",
        mime_type=detected_mime,
        file_size_bytes=len(file_bytes),
        extracted_token=extracted_token,
        status="PROCESSED"
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "success": True,
        "message": "File verified by server-side magic byte inspection and processed safely.",
        "report_id": report.id,
        "mime_type": detected_mime,
        "file_size_bytes": len(file_bytes),
        "extracted_token": extracted_token
    }
