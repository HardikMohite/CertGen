import logging
from pathlib import Path

from PIL import ImageFont
from PIL.ImageFont import FreeTypeFont

logger = logging.getLogger(__name__)

ALLOWED_FONT_EXTENSIONS = {"ttf", "otf"}


def validate_font_file(font_path: str) -> None:
    """
    Validate that a font file exists and has an allowed extension.

    Allowed extensions: ttf, otf.

    Args:
        font_path: Path to the font file.

    Raises:
        FileNotFoundError: If the font file does not exist.
        ValueError:        If the file extension is not ttf or otf.
    """
    path = Path(font_path)
    if not path.exists():
        raise FileNotFoundError(f"Font file not found: {font_path}")
    extension = path.suffix.lstrip(".").lower()
    if extension not in ALLOWED_FONT_EXTENSIONS:
        raise ValueError(
            f"Invalid font extension '{extension}'. Allowed: {', '.join(sorted(ALLOWED_FONT_EXTENSIONS))}"
        )
    logger.debug("Font file validated: %s", path.name)


def load_font(font_path: str, font_size: int) -> FreeTypeFont:
    """
    Load a TrueType or OpenType font from disk and return a Pillow ImageFont instance.

    Args:
        font_path: Path to a .ttf or .otf font file.
        font_size: Desired font size in points.

    Returns:
        A Pillow FreeTypeFont instance ready for use with ImageDraw.

    Raises:
        FileNotFoundError: If the font file does not exist.
        ValueError:        If the font extension is not supported.
    """
    validate_font_file(font_path)
    font = ImageFont.truetype(font_path, size=font_size)
    logger.debug("Font loaded: %s at size %d", Path(font_path).name, font_size)
    return font