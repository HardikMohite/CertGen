import os
import uuid
import logging
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from backend.services.file_validator import validate_template_file, validate_csv_file
from backend.utils.file_utils import save_upload_file
from backend.config import SESSIONS_DIR

logger = logging.getLogger(__name__)

# Persist uploaded fonts in a shared fonts folder
FONTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "fonts")
Path(FONTS_DIR).mkdir(parents=True, exist_ok=True)

MAX_TEMPLATE_BYTES = 10 * 1024 * 1024  # 10MB
MAX_CSV_BYTES = 5 * 1024 * 1024       # 5MB
MAX_FONT_BYTES = 10 * 1024 * 1024     # 10MB

router = APIRouter(prefix="/upload", tags=["upload"])


@router.get("/__ping")
async def upload_ping():
    return {"ok": True}


async def _enforce_size_limit(upload: UploadFile, max_bytes: int) -> None:
    # Prefer declared size if provided by client
    size_hdr = upload.headers.get("content-length") if upload.headers else None
    if size_hdr:
        try:
            if int(size_hdr) > max_bytes:
                raise HTTPException(status_code=413, detail="File too large.")
        except ValueError:
            pass

    # If unknown, peek a small chunk to ensure it's not empty; actual copy is streaming.
    await upload.seek(0)


@router.post("/template")
async def upload_template(
    session_id: str = Form(...),
    file: UploadFile = File(...),
):
    logger.info("Uploading template for session %s: %s", session_id, file.filename)

    session_path = os.path.join(SESSIONS_DIR, session_id)
    if not os.path.isdir(session_path):
        logger.warning("Template upload: session not found: %s", session_id)
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

    error = validate_template_file(file.filename)
    if error:
        logger.warning("Template upload validation failed: %s", error)
        raise HTTPException(status_code=400, detail=error)

    await _enforce_size_limit(file, MAX_TEMPLATE_BYTES)

    ext = os.path.splitext(file.filename)[1].lower()
    dest = os.path.join(session_path, f"template{ext}")

    # Ensure session dir exists (safety)
    os.makedirs(session_path, exist_ok=True)

    await save_upload_file(file, dest)
    logger.info("Template saved: %s", dest)
    return {"message": "Template uploaded.", "filename": os.path.basename(dest)}


@router.post("/csv")
async def upload_csv(
    session_id: str = Form(...),
    file: UploadFile = File(...),
):
    logger.info("Uploading CSV for session %s: %s", session_id, file.filename)

    session_path = os.path.join(SESSIONS_DIR, session_id)
    if not os.path.isdir(session_path):
        logger.warning("CSV upload: session not found: %s", session_id)
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

    error = validate_csv_file(file.filename)
    if error:
        logger.warning("CSV upload validation failed: %s", error)
        raise HTTPException(status_code=400, detail=error)

    await _enforce_size_limit(file, MAX_CSV_BYTES)

    dest = os.path.join(session_path, "names.csv")
    await save_upload_file(file, dest)
    logger.info("CSV saved: %s", dest)
    return {"message": "CSV uploaded.", "filename": "names.csv"}


@router.post("/font")
async def upload_font(
    session_id: str = Form(...),
    file: UploadFile = File(...),
):
    logger.info("Uploading font for session %s: %s", session_id, file.filename)

    # Keep session check (preserves existing workflow & prevents orphan uploads)
    session_path = os.path.join(SESSIONS_DIR, session_id)
    if not os.path.isdir(session_path):
        logger.warning("Font upload: session not found: %s", session_id)
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

    if not file.filename:
        raise HTTPException(status_code=400, detail="No font filename provided.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in (".ttf", ".otf"):
        raise HTTPException(status_code=400, detail="Only .ttf and .otf fonts are supported.")

    await _enforce_size_limit(file, MAX_FONT_BYTES)

    target_name = f"{uuid.uuid4().hex}{ext}"
    target_path = os.path.join(FONTS_DIR, target_name)

    await save_upload_file(file, target_path)
    logger.info("Font saved: %s", target_path)

    # Return shape compatible with existing frontend expectations
    return {"message": "Font uploaded", "path": target_path.replace("\\", "/"), "file": target_name}