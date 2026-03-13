import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from backend.config import SESSIONS_DIR
from backend.services.template_renderer import render_template_thumbnail

router = APIRouter()


@router.get("/upload/template/thumbnail/{session_id}")
def get_template_thumbnail(session_id: str):
    session_path = os.path.join(SESSIONS_DIR, session_id)
    if not os.path.isdir(session_path):
        raise HTTPException(status_code=404, detail="Session not found.")

    for ext in (".png", ".jpg", ".jpeg", ".pdf"):
        candidate = os.path.join(session_path, f"template{ext}")
        if os.path.isfile(candidate):
            thumb_path = os.path.join(session_path, "thumbnail.png")
            render_template_thumbnail(candidate, thumb_path)
            return FileResponse(thumb_path, media_type="image/png")

    raise HTTPException(status_code=404, detail="No template uploaded yet.")
