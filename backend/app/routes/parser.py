"""
EcoTrace AI — Parser Routes

POST /api/parse/electricity-bill — Parse uploaded electricity bills.
POST /api/parse/receipt — Parse grocery receipts.

SECURITY: Enforces 10MB limit and validates MIME types via magic bytes.
Uses pure-Python header detection — no system dependencies required.
"""

import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import aiosqlite

from app.db.database import get_db

router = APIRouter()

# Magic byte signatures for allowed file types
MAGIC_SIGNATURES: dict[bytes, str] = {
    b'\xff\xd8\xff': 'image/jpeg',
    b'\x89PNG\r\n\x1a\n': 'image/png',
    b'RIFF': 'image/webp',  # WebP starts with RIFF....WEBP
    b'%PDF': 'application/pdf',
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def detect_mime_type(content: bytes) -> str | None:
    """
    Detect MIME type from file magic bytes (header signatures).

    Pure-Python implementation — no libmagic dependency.
    Checks the first 16 bytes against known signatures.
    """
    header = content[:16]

    for sig, mime in MAGIC_SIGNATURES.items():
        if header.startswith(sig):
            # Extra check for WebP: must have WEBP at offset 8
            if mime == 'image/webp' and content[8:12] != b'WEBP':
                continue
            return mime

    return None


ALLOWED_MIME_TYPES = set(MAGIC_SIGNATURES.values())


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
    detected_mime = detect_mime_type(content)
    if detected_mime is None or detected_mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_MIME_TYPES)}",
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
        "detected_type": detect_mime_type(content),
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
