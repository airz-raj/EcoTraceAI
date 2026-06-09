"""
EcoTrace AI — Parser Routes

POST /api/parse/electricity-bill — Parse uploaded electricity bills.
POST /api/parse/receipt — Parse grocery receipts.

SECURITY: Enforces 10MB limit and validates MIME types via magic bytes.
"""

import uuid
import magic

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import aiosqlite

from app.db.database import get_db

router = APIRouter()

# Allowed MIME types (validated via magic bytes, not extensions)
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


async def validate_upload(file: UploadFile) -> bytes:
    """Validate file size and MIME type using magic bytes."""
    content = await file.read()

    # Size check
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB.",
        )

    # MIME type validation via magic bytes (not file extension)
    detected_mime = magic.from_buffer(content, mime=True)
    if detected_mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid file type '{detected_mime}'. Allowed: {', '.join(ALLOWED_MIME_TYPES)}",
        )

    return content


@router.post("/parse/electricity-bill")
async def parse_electricity_bill(
    file: UploadFile = File(...),
    db: aiosqlite.Connection = Depends(get_db),
):
    """
    Parse an uploaded electricity bill image.

    Security:
    - 10MB file size limit
    - MIME type validated via magic bytes
    - No file extension trust
    """
    content = await validate_upload(file)

    # Store the parsing record
    bill_id = str(uuid.uuid4())

    # In production, this would use PaddleOCR for server-side processing
    # For now, return a placeholder indicating client-side OCR is preferred
    await db.execute(
        """INSERT INTO parsed_bills (id, bill_type, confidence, raw_text)
           VALUES (?, 'electricity', 0.0, 'server-side-pending')""",
        (bill_id,),
    )
    await db.commit()

    return {
        "id": bill_id,
        "status": "uploaded",
        "message": "File validated successfully. Use client-side OCR for immediate processing.",
        "file_size_bytes": len(content),
        "detected_type": magic.from_buffer(content, mime=True),
    }


@router.post("/parse/receipt")
async def parse_receipt(
    file: UploadFile = File(...),
    db: aiosqlite.Connection = Depends(get_db),
):
    """Parse an uploaded grocery receipt image."""
    content = await validate_upload(file)

    bill_id = str(uuid.uuid4())

    await db.execute(
        """INSERT INTO parsed_bills (id, bill_type, confidence, raw_text)
           VALUES (?, 'receipt', 0.0, 'server-side-pending')""",
        (bill_id,),
    )
    await db.commit()

    return {
        "id": bill_id,
        "status": "uploaded",
        "message": "Receipt validated. Use client-side OCR for immediate processing.",
        "file_size_bytes": len(content),
    }
