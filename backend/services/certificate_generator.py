import logging
import re
import unicodedata
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple

from backend.services.name_formatter import normalize_name
from backend.services.template_renderer import load_template, render_text_on_template
from backend.utils.font_loader import validate_font_file

logger = logging.getLogger(__name__)


def _sanitize_filename(name: str) -> str:
    """
    Convert a normalized participant name into a safe ASCII filename stem.

    Steps:
    1. Normalize unicode characters to their closest ASCII equivalents.
    2. Replace spaces with underscores.
    3. Strip any character that is not alphanumeric or an underscore.
    4. Collapse consecutive underscores into one.
    5. Strip leading/trailing underscores.

    Args:
        name: Normalized participant name (e.g. "Hardik Mohite").

    Returns:
        A clean, filesystem-safe filename stem (e.g. "Hardik_Mohite").
    """
    # Decompose unicode and drop non-ASCII combining characters
    ascii_name = unicodedata.normalize("NFKD", name)
    ascii_name = ascii_name.encode("ascii", errors="ignore").decode("ascii")

    ascii_name = ascii_name.replace(" ", "_")
    ascii_name = re.sub(r"[^\w]", "", ascii_name)       # keep alphanumeric + underscore
    ascii_name = re.sub(r"_+", "_", ascii_name)         # collapse consecutive underscores
    ascii_name = ascii_name.strip("_")

    return ascii_name


def _unique_filename(base_stem: str, seen: Dict[str, int]) -> str:
    """
    Produce a unique filename stem using a counter suffix for duplicates.

    The first occurrence returns the base stem unchanged.
    Subsequent occurrences append an incrementing counter:
        Hardik_Mohite, Hardik_Mohite_1, Hardik_Mohite_2, ...

    Args:
        base_stem: Sanitized filename stem without extension.
        seen:      Mutable dict tracking how many times each stem has appeared.

    Returns:
        A unique filename stem for this occurrence.
    """
    count = seen[base_stem]
    seen[base_stem] += 1

    if count == 0:
        return base_stem
    return f"{base_stem}_{count}"


def generate_certificates(
    template_path: str | Path,
    names: List[str],
    position: dict,
    font_path: str | Path,
    font_size: int,
    output_folder: str | Path,
    color: Tuple[int, int, int] = (0, 0, 0),
) -> List[Path]:
    """
    Generate individual certificate images for each participant name.

    The template is loaded exactly once before the loop and reused for every
    certificate. Each render call works on an internal copy, so the base
    template object is never mutated.

    Duplicate participant names receive counter-suffixed filenames:
        Hardik_Mohite.png, Hardik_Mohite_1.png, Hardik_Mohite_2.png

    Args:
        template_path:  Path to the certificate template image.
        names:          List of raw participant name strings from the CSV.
        position:       Dict with 'x_percent' and 'y_percent' keys (0–100).
        font_path:      Path to a TrueType or OpenType font file.
        font_size:      Font size in points. Must be a positive integer.
        output_folder:  Directory where certificate images will be saved.
        color:          RGB tuple for text color. Defaults to black (0, 0, 0).

    Returns:
        List of Path objects pointing to every generated certificate file,
        in the order they were created.

    Raises:
        FileNotFoundError: If the template file or font file does not exist.
        ValueError:        If the font file extension is not supported,
                           or if the output_folder path is invalid.
        NotADirectoryError: If output_folder exists but is not a directory.
    """
    template_path = Path(template_path)
    font_path = Path(font_path)
    output_folder = Path(output_folder)

    # --- Pre-flight validation ---------------------------------------------------

    if not template_path.exists():
        raise FileNotFoundError(f"Template file not found: {template_path}")

    validate_font_file(str(font_path))  # raises FileNotFoundError or ValueError

    if output_folder.exists() and not output_folder.is_dir():
        raise NotADirectoryError(f"Output path exists but is not a directory: {output_folder}")

    output_folder.mkdir(parents=True, exist_ok=True)

    # --- Load template once ------------------------------------------------------

    template = load_template(template_path)
    logger.info(
        "Certificate generation started. Template: '%s', Names: %d, Output: '%s'",
        template_path.name,
        len(names),
        output_folder,
    )

    # --- Generate certificates ---------------------------------------------------

    generated_files: List[Path] = []
    skipped_count: int = 0
    seen_stems: Dict[str, int] = defaultdict(int)

    for raw_name in names:
        clean_name = normalize_name(raw_name)

        if not clean_name:
            skipped_count += 1
            logger.warning("Skipping empty name entry (raw value: %r).", raw_name)
            continue

        base_stem = _sanitize_filename(clean_name)

        if not base_stem:
            skipped_count += 1
            logger.warning(
                "Skipping name '%s': sanitized filename is empty after character removal.",
                clean_name,
            )
            continue

        unique_stem = _unique_filename(base_stem, seen_stems)
        filename = unique_stem + ".png"
        output_path = output_folder / filename

        image = render_text_on_template(
            template=template,
            text=clean_name,
            position=position,
            font_path=str(font_path),
            font_size=font_size,
            color=color,
        )

        image.save(str(output_path), format="PNG")
        generated_files.append(output_path)
        logger.debug("Certificate saved: %s", filename)

    # --- Summary -----------------------------------------------------------------

    logger.info(
        "Certificate generation complete. Created: %d, Skipped: %d, Total input: %d.",
        len(generated_files),
        skipped_count,
        len(names),
    )

    return generated_files