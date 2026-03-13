import os
from fastapi import APIRouter
from backend.config import SESSIONS_DIR

router = APIRouter()


@router.get("/debug/session/{session_id}")
def debug_session(session_id: str):
    session_path = os.path.join(SESSIONS_DIR, session_id)
    exists = os.path.isdir(session_path)
    files = os.listdir(session_path) if exists else []
    return {
        "sessions_dir": SESSIONS_DIR,
        "session_path": session_path,
        "session_exists": exists,
        "files": files,
    }
