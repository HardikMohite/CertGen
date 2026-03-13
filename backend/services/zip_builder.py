import logging
import zipfile
from pathlib import Path

logger = logging.getLogger(__name__)


def create_zip(folder_path: str | Path, output_zip_path: str | Path) -> Path:
    """
    Zip all files in the given folder into a single ZIP archive.

    Only immediate file children of folder_path are included (no subdirectories).

    Args:
        folder_path:      Path to the folder containing certificate files.
        output_zip_path:  Destination path for the output ZIP file.

    Returns:
        Path to the created ZIP file.

    Raises:
        FileNotFoundError: If folder_path does not exist.
    """
    folder_path = Path(folder_path)
    output_zip_path = Path(output_zip_path)

    if not folder_path.exists():
        raise FileNotFoundError(f"Certificate folder not found: {folder_path}")

    files = sorted(f for f in folder_path.iterdir() if f.is_file())

    with zipfile.ZipFile(output_zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for file in files:
            zf.write(file, arcname=file.name)

    logger.info("ZIP created: %s (%d files)", output_zip_path.name, len(files))
    return output_zip_path