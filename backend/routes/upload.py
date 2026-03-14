import os
import uuid
import logging
import shutil
import zipfile
import tempfile
from pathlib import Path
from typing import Iterator, Annotated

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
MAX_FONT_BYTES = 20 * 1024 * 1024     # 20MB

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


def _detect_style_from_filename(name: str) -> str:
    n = (name or "").lower().replace("-", "").replace("_", "").replace(" ", "")
    if "bolditalic" in n or ("bold" in n and "italic" in n):
        return "bold_italic"
    if "bold" in n:
        return "bold"
    if "italic" in n or "oblique" in n:
        return "italic"
    return "regular"


def _detect_family_from_filename(filename: str) -> str:
    base = os.path.splitext(os.path.basename(filename))[0]

    # Remove common style tokens
    lowered = base
    for t in (
        "BoldItalic",
        "Bold_Italic",
        "Bold-Italic",
        "Bold",
        "Italic",
        "Regular",
        "Medium",
        "SemiBold",
        "Light",
        "Thin",
        "Black",
    ):
        lowered = lowered.replace(t, "")

    cleaned = lowered.replace("_", " ").replace("-", " ").strip()
    return cleaned or base


def _safe_extract_zip(zip_path: str, dest_dir: str) -> None:
    """Prevent ZipSlip by validating each file path before extraction."""
    with zipfile.ZipFile(zip_path) as z:
        for member in z.infolist():
            # skip dirs
            if member.is_dir():
                continue
            target_path = os.path.normpath(os.path.join(dest_dir, member.filename))
            if not target_path.startswith(os.path.abspath(dest_dir)):
                raise HTTPException(status_code=400, detail="Unsafe ZIP content.")
        z.extractall(dest_dir)


def _iter_font_files(root_dir: str) -> Iterator[str]:
    for root, _, files in os.walk(root_dir):
        for f in files:
            if f.lower().endswith((".ttf", ".otf")):
                yield os.path.join(root, f)


@router.post(
    "/template",
    responses={
        400: {"description": "Invalid template file"},
        404: {"description": "Session not found"},
        413: {"description": "File too large"},
    },
)
async def upload_template(
    session_id: Annotated[str, Form(...)],
    file: Annotated[UploadFile, File(...)],
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


@router.post(
    "/csv",
    responses={
        400: {"description": "Invalid CSV file"},
        404: {"description": "Session not found"},
        413: {"description": "File too large"},
    },
)
async def upload_csv(
    session_id: Annotated[str, Form(...)],
    file: Annotated[UploadFile, File(...)],
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


@router.post(
    "/font",
    responses={
        400: {"description": "Invalid font file"},
        404: {"description": "Session not found"},
        413: {"description": "File too large"},
    },
)
async def upload_font(
    session_id: Annotated[str, Form(...)],
    file: Annotated[UploadFile, File(...)],
):
    logger.info("Uploading font for session %s: %s", session_id, file.filename)

    # Keep session check (preserves existing workflow & prevents orphan uploads)
    session_path = os.path.join(SESSIONS_DIR, session_id)
    if not os.path.isdir(session_path):
        logger.warning("Font upload: session not found: %s", session_id)
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

    if not file.filename:
        raise HTTPException(status_code=400, detail="No font filename provided.")

    await _enforce_size_limit(file, MAX_FONT_BYTES)

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in (".ttf", ".otf", ".zip"):
        raise HTTPException(status_code=400, detail="Only .ttf, .otf and .zip fonts are supported.")

    # Save upload to a temp file first
    with tempfile.TemporaryDirectory() as td:
        temp_path = os.path.join(td, f"upload{ext}")
        await save_upload_file(file, temp_path)

        font_paths = []
        if ext == ".zip":
            extract_dir = os.path.join(td, "extract")
            os.makedirs(extract_dir, exist_ok=True)
            _safe_extract_zip(temp_path, extract_dir)
            font_paths = list(_iter_font_files(extract_dir))
            if not font_paths:
                raise HTTPException(status_code=400, detail="ZIP contains no .ttf/.otf fonts.")
        else:
            font_paths = [temp_path]

        written = []
        families = {}
        for fp in font_paths:
            family = _detect_family_from_filename(os.path.basename(fp))
            style = _detect_style_from_filename(os.path.basename(fp))

            family_dir_name = family.replace(" ", "")
            family_dir = os.path.join(FONTS_DIR, family_dir_name)
            os.makedirs(family_dir, exist_ok=True)

            dest_name = f"{style}{os.path.splitext(fp)[1].lower()}"
            dest_path = os.path.join(family_dir, dest_name)

            shutil.copyfile(fp, dest_path)
            written.append(dest_path)

            families.setdefault(family, set()).add(style)

        # Return a minimal response compatible with existing frontend (it refreshes /fonts)
        # plus metadata for future use.
        return {
            "message": "Font(s) uploaded",
            "families": [
                {"family": fam, "styles": sorted(styles)}
                for fam, styles in families.items()
            ],
            "files": written,
        }