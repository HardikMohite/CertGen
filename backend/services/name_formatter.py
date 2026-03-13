import re


def normalize_name(name: str) -> str:
    """
    Normalize a participant name.

    Steps:
    1. Strip leading/trailing whitespace.
    2. Replace underscores and hyphens with spaces.
    3. Collapse multiple consecutive spaces into one.
    4. Convert to Title Case.

    Example:
        "  hardik___mohite--test  " -> "Hardik Mohite Test"

    Args:
        name: Raw name string from the CSV.

    Returns:
        Cleaned, title-cased name string.
    """
    name = name.strip()
    name = re.sub(r"[_\-]+", " ", name)
    name = re.sub(r"\s+", " ", name)
    name = name.title()
    return name