from typing import Tuple
from fastapi import HTTPException, UploadFile, status
from backend.config import settings

# Allowed Magic Byte Signatures
MAGIC_SIGNATURES = {
    "image/png": [b"\x89PNG\r\n\x1a\n"],
    "image/jpeg": [b"\xff\xd8\xff"],
    "application/pdf": [b"%PDF-"]
}

async def validate_uploaded_file(file: UploadFile) -> Tuple[bytes, str]:
    """
    Validates uploaded file server-side by checking:
    1. Maximum file size limit (10MB)
    2. True file content signatures (magic bytes) against permitted types:
       - image/png
       - image/jpeg
       - application/pdf
    Raises HTTPException 400 or 413 if validation fails.
    """
    # 1. Read file content into memory buffer
    contents = await file.read()
    file_size = len(contents)
    
    # 2. Enforce Max Size Limit
    if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed upload size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB."
        )
    
    if file_size < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty or corrupted."
        )

    # 3. Inspect Magic Byte Signatures (Content-based detection)
    detected_mime = None
    
    # Check PNG
    if contents.startswith(b"\x89PNG\r\n\x1a\n"):
        detected_mime = "image/png"
    # Check JPEG
    elif contents.startswith(b"\xff\xd8\xff"):
        detected_mime = "image/jpeg"
    # Check PDF
    elif contents.startswith(b"%PDF-"):
        detected_mime = "application/pdf"
        
    if not detected_mime:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Server-side content inspection rejected this file. Only authentic PNG, JPEG, and PDF documents are permitted."
        )
        
    return contents, detected_mime
