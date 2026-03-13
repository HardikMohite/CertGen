import os
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.config import SESSIONS_DIR
from backend.services.csv_parser import parse_csv
from backend.services.template_renderer import render_certificate

router = APIRouter()


class TextArea(BaseModel):
    x: float
    y: float
    width: float
    height: float


class GenerateRequest(BaseModel):
    session_id: str

    # legacy
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


@router.post("/generate")
def generate_certificates(req: GenerateRequest):
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

    output_dir = os.path.join(session_path, "output")
    os.makedirs(output_dir, exist_ok=True)

    text_area: Optional[Dict[str, Any]] = None
    if req.text_area is not None:
        text_area = req.text_area.model_dump()

    output_ext = req.output_format.lower().strip()
    if output_ext not in ("png", "pdf", "jpg", "jpeg"):
        output_ext = "png"

    generated_files = []
    for idx, name in enumerate(names):
        safe = "".join(c if c.isalnum() or c in " _-" else "_" for c in name).strip()
        if not safe:
            safe = f"participant_{idx+1}"

        out_file = os.path.join(output_dir, f"{safe}.{output_ext}")
        try:
            render_certificate(
                template_path=template_path,
                name=name,
                x_percent=req.x_percent,
                y_percent=req.y_percent,
                text_area=text_area,
                font_path=req.font_path,
                font_size=req.font_size,
                font_color=req.font_color,
                output_path=out_file,
                output_format=output_ext,
                bold=bool(req.bold),
                italic=bool(req.italic),
            )
            generated_files.append(os.path.basename(out_file))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed on '{name}': {str(e)}")

    on_disk = [
        f for f in os.listdir(output_dir)
        if os.path.isfile(os.path.join(output_dir, f))
    ]

    return {
        "message": "Certificates generated.",
        "total": len(generated_files),
        "output_dir": output_dir,
        "files_written": len(on_disk),
        "format": output_ext,
    }