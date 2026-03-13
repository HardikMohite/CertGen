import asyncio
import logging
import shutil
import time
from pathlib import Path
from typing import List

import backend.config as config

logger = logging.getLogger(__name__)

BASE_TEMP_DIR = Path(__file__).resolve().parent.parent / "temp"


def scan_sessions_directory() -> List[Path]:
    """
    Scan the temp directory and return a list of session folder paths.

    Only immediate subdirectories of BASE_TEMP_DIR are returned.

    Returns:
        List of Path objects representing session directories.
    """
    if not BASE_TEMP_DIR.exists():
        return []
    return [entry for entry in BASE_TEMP_DIR.iterdir() if entry.is_dir()]


def is_session_expired(session_path: Path) -> bool:
    """
    Determine whether a session folder has exceeded the configured timeout.

    Expiration is based on the folder's last modification time compared to
    the current time and SESSION_TIMEOUT_MINUTES from config.

    Args:
        session_path: Path to the session directory.

    Returns:
        True if the session has expired, False otherwise.
    """
    try:
        last_modified = session_path.stat().st_mtime
    except FileNotFoundError:
        return False

    age_seconds = time.time() - last_modified
    timeout_seconds = config.SESSION_TIMEOUT_MINUTES * 60
    return age_seconds >= timeout_seconds


def cleanup_expired_sessions() -> None:
    """
    Scan all session folders and delete any that have exceeded the timeout.

    Handles missing directories gracefully in case a folder is removed
    between the scan and the delete step.
    """
    sessions = scan_sessions_directory()
    for session_path in sessions:
        try:
            if is_session_expired(session_path):
                shutil.rmtree(session_path, ignore_errors=True)
                logger.info("Deleted expired session: %s", session_path.name)
        except Exception as exc:
            logger.warning("Error while processing session %s: %s", session_path.name, exc)


async def start_cleanup_worker() -> None:
    """
    Start the background cleanup loop as an async coroutine.

    Runs cleanup_expired_sessions() on every CLEANUP_INTERVAL_MINUTES cycle.
    The loop runs indefinitely and will not crash if individual session
    folders disappear during processing.
    """
    interval_seconds = config.CLEANUP_INTERVAL_MINUTES * 60
    logger.info(
        "Cleanup worker started. Interval: %ds, Timeout: %dmin",
        interval_seconds,
        config.SESSION_TIMEOUT_MINUTES,
    )
    while True:
        try:
            cleanup_expired_sessions()
        except Exception as exc:
            logger.error("Unexpected error in cleanup worker: %s", exc)
        await asyncio.sleep(interval_seconds)