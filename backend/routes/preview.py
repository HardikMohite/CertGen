import os
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from backend.config import SESSIONS_DIR
from backend.services.template_renderer import render_preview
from backend.services.csv_parser import parse_csv

router = APIRouter()


class TextArea(BaseModel):
    x: float
    y: float
    width: float
    height: float


class PreviewRequest(BaseModel):
    session_id: str

    # legacy (still accepted)
    x_percent: Optional[float] = None
    y_percent: Optional[float] = None

    # new
    text_area: Optional[TextArea] = None

    font_path: str
    font_size: int = 48
    font_color: str = "#000000"
    output_format: str = "png"

    bold: Optional[bool] = False
    italic: Optional[bool] = False


@router.post("/preview")
def preview_certificate(req: PreviewRequest):
    session_path = os.path.join(SESSIONS_DIR, req.session_id)
    if not os.path.isdir(session_path):
        raise HTTPException(status_code=404, detail="Session not found.")

    template_path = None
    for ext in (".png", ".jpg", ".jpeg", ".pdf"):
        candidate = os.path.join(session_path, f"template{ext}")
        if os.path.isfile(candidate):
            template_path = candidate
            break

    if not template_path:
        raise HTTPException(status_code=404, detail="Template not uploaded yet.")

    csv_path = os.path.join(session_path, "names.csv")
    if not os.path.isfile(csv_path):
        raise HTTPException(status_code=404, detail="CSV not uploaded yet.")

    names = parse_csv(csv_path)
    if not names:
        raise HTTPException(status_code=400, detail="CSV contains no names.")

    preview_path = os.path.join(session_path, "preview.png")

    # Determine render target:
    # - if text_area provided: use it (pixel coords)
    # - else fallback to legacy x_percent/y_percent (center point)
    text_area: Optional[Dict[str, Any]] = None
    if req.text_area is not None:
        text_area = req.text_area.model_dump()

    try:
        render_preview(
            template_path=template_path,
            name=names[0],
            x_percent=req.x_percent,
            y_percent=req.y_percent,
            text_area=text_area,
            font_path=req.font_path,
            font_size=req.font_size,
            font_color=req.font_color,
            output_path=preview_path,
            bold=bool(req.bold),
            italic=bool(req.italic),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Render error: {str(e)}")

    return FileResponse(preview_path, media_type="image/png")