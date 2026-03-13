import os
import zipfile
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from backend.config import SESSIONS_DIR

router = APIRouter(prefix="/download", tags=["download"])


@router.get("/{session_id}")
def download_zip(session_id: str):
    session_path = os.path.join(SESSIONS_DIR, session_id)
    if not os.path.isdir(session_path):
        raise HTTPException(status_code=404, detail="Session not found.")

    output_dir = os.path.join(session_path, "output")
    if not os.path.isdir(output_dir):
        raise HTTPException(status_code=404, detail="No certificates generated yet.")

    files = [
        f for f in os.listdir(output_dir) if os.path.isfile(os.path.join(output_dir, f))
    ]
    if not files:
        raise HTTPException(status_code=404, detail="No certificate files found.")

    zip_path = os.path.join(session_path, "certificates.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for fname in files:
            zf.write(os.path.join(output_dir, fname), arcname=fname)

    return FileResponse(zip_path, media_type="application/zip", filename="certificates.zip")