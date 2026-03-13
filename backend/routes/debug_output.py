import os
from fastapi import APIRouter, HTTPException
from backend.config import SESSIONS_DIR

router = APIRouter()


@router.get("/debug/output/{session_id}")
def debug_output(session_id: str):
    session_path = os.path.join(SESSIONS_DIR, session_id)
    if not os.path.isdir(session_path):
        raise HTTPException(status_code=404, detail="Session not found.")

    output_dir = os.path.join(session_path, "output")
    exists = os.path.isdir(output_dir)
    files = []
    if exists:
        files = [
            f
            for f in os.listdir(output_dir)
            if os.path.isfile(os.path.join(output_dir, f))
        ]

    return {
        "sessions_dir": SESSIONS_DIR,
        "session_path": session_path,
        "output_dir": output_dir,
        "output_exists": exists,
        "files": files,
    }
