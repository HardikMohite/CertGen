import os
from pathlib import Path

from fastapi import APIRouter

try:
    # Optional legacy catalog
    from backend.config import FONT_CATALOG  # type: ignore
except Exception:
    FONT_CATALOG = []

router = APIRouter(tags=["fonts"])

FONTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "fonts")


def _style_label(style: str) -> str:
    return {
        "regular": "Regular",
        "bold": "Bold",
        "italic": "Italic",
        "bold_italic": "Bold Italic",
    }.get(style, style)


def _detect_style_from_stem(stem: str) -> str:
    s = (stem or "").lower().replace("-", "").replace("_", "")
    if s in ("bolditalic", "boldital", "bold_italic") or ("bold" in s and "italic" in s):
        return "bold_italic"
    if "bold" in s:
        return "bold"
    if "italic" in s or "oblique" in s:
        return "italic"
    if "regular" in s:
        return "regular"
    return "regular"


def _catalog_fonts() -> list[dict]:
    out: list[dict] = []
    for font in FONT_CATALOG or []:
        file = font.get("file")
        if not file:
            continue
        family = os.path.splitext(os.path.basename(file))[0]
        out.append(
            {
                "family": family,
                "style": "regular",
                "path": f"/static/fonts/{file}",
                "label": font.get("label") or f"{family} (Regular)",
                "source": "built-in",
                # backward-compat keys
                "file": file,
            }
        )
    return out


def _uploaded_fonts() -> list[dict]:
    out: list[dict] = []
    root = Path(FONTS_DIR)
    if not root.exists():
        return out

    for p in root.rglob("*"):
        if not p.is_file():
            continue
        if p.suffix.lower() not in (".ttf", ".otf"):
            continue

        try:
            rel = p.relative_to(root)
        except ValueError:
            continue

        rel_parts = rel.parts

        # Expected: <Family>/<style>.ttf
        if len(rel_parts) >= 2:
            family = rel_parts[0]
            style = _detect_style_from_stem(p.stem)
        else:
            # legacy: fonts dropped directly into backend/fonts
            family = p.stem
            style = "regular"

        rel_posix = str(rel).replace("\\", "/")
        label = f"{family} ({_style_label(style)})"

        out.append(
            {
                "family": family,
                "style": style,
                "path": f"/static/fonts/{rel_posix}",
                "label": label,
                "source": "uploaded",
                # backward-compat keys
                "file": rel_posix,
            }
        )

    return out


def _dedupe_by_path(fonts: list[dict]) -> list[dict]:
    seen: set[str] = set()
    deduped: list[dict] = []
    for f in fonts:
        path = f.get("path")
        if not path or path in seen:
            continue
        seen.add(path)
        deduped.append(f)
    return deduped


@router.get("/fonts")
async def list_fonts():
    fonts = _catalog_fonts() + _uploaded_fonts()
    return _dedupe_by_path(fonts)
