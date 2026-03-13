import csv
import logging
from pathlib import Path
from typing import List

logger = logging.getLogger(__name__)


def parse_csv(csv_path: str | Path) -> List[str]:
    """
    Read participant names from the first column of a CSV file.

    Skips the header row if it contains a common header label (name, Name, NAME).
    Returns a list of raw name strings with empty rows excluded.

    Args:
        csv_path: Path to the participants.csv file inside a session folder.

    Returns:
        List of raw name strings from the first column.

    Raises:
        FileNotFoundError: If the CSV file does not exist at the given path.
    """
    csv_path = Path(csv_path)

    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    names: List[str] = []

    with open(csv_path, newline="", encoding="utf-8-sig") as csvfile:
        reader = csv.reader(csvfile)
        for row in reader:
            if not row:
                continue
            name = row[0].strip()
            if name and name.lower() not in ("name", "names", "participant", "participants"):
                names.append(name)

    logger.info("CSV parsed: %d names read from %s", len(names), csv_path.name)
    return names