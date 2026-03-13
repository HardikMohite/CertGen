import logging
import shutil
from pathlib import Path

from backend.services.session_manager import get_session_path

logger = logging.getLogger(__name__)


def cleanup_session(session_id: str) -> None:
    """
    Delete a session directory and all its contents.

    Safely handles the case where the session directory does not exist.

    Args:
        session_id: The UUID string identifying the session to clean up.
    """
    session_path: Path = get_session_path(session_id)
    if session_path.exists() and session_path.is_dir():
        shutil.rmtree(session_path)
        logger.info("Session cleaned up: %s", session_id)
    else:
        logger.warning("Cleanup called on missing session: %s", session_id)