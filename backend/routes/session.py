import logging
import os
import uuid

from fastapi import APIRouter

from backend.config import SESSIONS_DIR
from backend.models.session_models import SessionCreateResponse
from backend.services import session_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/session", tags=["Session"])


@router.post("/create", response_model=SessionCreateResponse)
def create_session() -> SessionCreateResponse:
    """
    Create a new session and return the session ID.

    A unique UUID-based folder is created inside backend/temp/ to store
    all files associated with this session.

    Returns:
        SessionCreateResponse with the new session_id and a confirmation message.
    """
    session_id = str(uuid.uuid4())
    session_path = os.path.join(SESSIONS_DIR, session_id)
    os.makedirs(session_path, exist_ok=True)
    logger.info("New session created via API: %s", session_id)
    return SessionCreateResponse(
        session_id=session_id,
        message="Session created successfully",
    )