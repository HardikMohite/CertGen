import logging
import shutil
import uuid
from pathlib import Path

logger = logging.getLogger(__name__)

BASE_TEMP_DIR = Path(__file__).resolve().parent.parent / "temp"


def create_session() -> str:
    """
    Create a new session folder and return the session ID.

    Returns:
        A UUID string identifying the new session.
    """
    session_id = str(uuid.uuid4())
    session_path = BASE_TEMP_DIR / session_id
    session_path.mkdir(parents=True, exist_ok=True)
    logger.info("Session created: %s", session_id)
    return session_id


def get_session_path(session_id: str) -> Path:
    """
    Return the filesystem path to a session folder.

    Args:
        session_id: UUID string of the session.

    Returns:
        Path object pointing to the session directory.
    """
    return BASE_TEMP_DIR / session_id


def delete_session(session_id: str) -> None:
    """
    Delete the session folder and all its contents.

    Safely handles the case where the folder no longer exists.

    Args:
        session_id: UUID string of the session to delete.
    """
    session_path = BASE_TEMP_DIR / session_id
    if session_path.exists() and session_path.is_dir():
        shutil.rmtree(session_path)
        logger.info("Session deleted: %s", session_id)
    else:
        logger.warning("Session not found for deletion: %s", session_id)