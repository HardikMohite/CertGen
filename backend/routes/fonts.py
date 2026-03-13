import os
from fastapi import APIRouter, Query

router = APIRouter()

FONTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "fonts")

FONT_CATALOG = [
    {"label": "Arial", "file": "arial.ttf"},
    {"label": "Arial Bold", "file": "arial_bold.ttf"},
    {"label": "Times New Roman", "file": "times.ttf"},
    {"label": "Times New Roman Bold", "file": "times_bold.ttf"},
    {"label": "Georgia", "file": "georgia.ttf"},
    {"label": "Georgia Bold", "file": "georgia_bold.ttf"},
    {"label": "Verdana", "file": "verdana.ttf"},
    {"label": "Verdana Bold", "file": "verdana_bold.ttf"},
    {"label": "Trebuchet MS", "file": "trebuchet.ttf"},
    {"label": "Trebuchet MS Bold", "file": "trebuchet_bold.ttf"},
]


def _normalize(p: str) -> str:
    return p.replace("\\", "/")


@router.get("/fonts")
def list_fonts(session_id: str | None = Query(default=None)):
    available = []

    for font in FONT_CATALOG:
        full_path = os.path.join(FONTS_DIR, font["file"])
        if os.path.isfile(full_path):
            available.append({
                "label": font["label"],
                "file": font["file"],
                "path": _normalize(full_path),
                "source": "system",
            })

    if session_id:
        from backend.config import SESSIONS_DIR
        session_fonts_dir = os.path.join(SESSIONS_DIR, session_id, "fonts")
        if os.path.isdir(session_fonts_dir):
            for fname in os.listdir(session_fonts_dir):
                if not fname.lower().endswith((".ttf", ".otf")):
                    continue
                available.append({
                    "label": os.path.splitext(fname)[0],
                    "file": fname,
                    "path": _normalize(os.path.join(session_fonts_dir, fname)),
                    "source": "uploaded",
                })

    return {"fonts": available}
