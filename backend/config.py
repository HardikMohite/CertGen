import os


def _get_env_int(key: str, default: int) -> int:
    """Read an integer value from an environment variable with a fallback default."""
    value = os.environ.get(key)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


def _get_env_str(key: str, default: str) -> str:
    """Read a string value from an environment variable with a fallback default."""
    return os.environ.get(key, default)


# Directory where temporary session folders are stored.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SESSIONS_DIR = os.path.join(BASE_DIR, "sessions")
os.makedirs(SESSIONS_DIR, exist_ok=True)
TEMP_DIR: str = _get_env_str("TEMP_DIR", "backend/temp")

# Minutes before an idle session is automatically deleted by the cleanup worker.
SESSION_TIMEOUT_MINUTES: int = _get_env_int("SESSION_TIMEOUT_MINUTES", 30)

# How often (in minutes) the cleanup worker scans for expired sessions.
CLEANUP_INTERVAL_MINUTES: int = _get_env_int("CLEANUP_INTERVAL_MINUTES", 5)

# Maximum allowed template file size in megabytes.
MAX_TEMPLATE_SIZE_MB: int = _get_env_int("MAX_TEMPLATE_SIZE_MB", 10)

# Maximum number of rows permitted in an uploaded CSV file.
MAX_CSV_ROWS: int = _get_env_int("MAX_CSV_ROWS", 10000)

# Maximum number of certificates that can be generated in a single session.
MAX_CERTIFICATES: int = _get_env_int("MAX_CERTIFICATES", 5000)