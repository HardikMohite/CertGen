import os
from typing import Optional, Dict, Any, Tuple

from PIL import Image, ImageDraw, ImageFont


def _load_image(template_path: str) -> Image.Image:
    ext = os.path.splitext(template_path)[1].lower()
    if ext == ".pdf":
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(template_path)
            page = doc[0]
            mat = fitz.Matrix(2.0, 2.0)  # render at higher resolution
            pix = page.get_pixmap(matrix=mat, alpha=False)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            doc.close()
            return img.convert("RGBA")
        except ImportError:
            raise RuntimeError("PyMuPDF is required for PDF templates. Run: pip install pymupdf")
    return Image.open(template_path).convert("RGBA")


def _get_font(font_path: str, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(font_path, size)
    except Exception:
        return ImageFont.load_default()


def _measure(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> Tuple[int, int]:
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def _fit_font_size(draw: ImageDraw.ImageDraw, text: str, font_path: str, start_size: int,
                   max_width: float, max_height: float) -> ImageFont.ImageFont:
    """
    Reduce font size until it fits inside the rectangle.
    Guard with height as well to avoid tall glyph overflow.
    """
    size = max(6, int(start_size))
    font = _get_font(font_path, size)
    w, h = _measure(draw, text, font)

    # If default font doesn't support measurement well, still try.
    while size > 6 and (w > max_width or h > max_height):
        size -= 1
        font = _get_font(font_path, size)
        w, h = _measure(draw, text, font)
    return font


def _resolve_target(img: Image.Image,
                    x_percent: Optional[float],
                    y_percent: Optional[float],
                    text_area: Optional[Dict[str, Any]]) -> Tuple[float, float, float, float]:
    """
    Returns a rectangle in IMAGE pixel coordinates: (x, y, width, height)
    If text_area provided from frontend (pixel coords), use it.
    Else fallback to legacy center point (x_percent,y_percent) and use a default box.
    """
    width, height = img.size

    if text_area:
        x = float(text_area.get("x", 0))
        y = float(text_area.get("y", 0))
        w = float(text_area.get("width", width * 0.6))
        h = float(text_area.get("height", height * 0.08))
        return x, y, w, h

    # legacy fallback
    xp = float(x_percent if x_percent is not None else 50.0)
    yp = float(y_percent if y_percent is not None else 50.0)
    cx = (xp / 100.0) * width
    cy = (yp / 100.0) * height

    w = width * 0.6
    h = height * 0.08
    x = cx - w / 2
    y = cy - h / 2
    return x, y, w, h


def _draw_name(img: Image.Image,
               name: str,
               x_percent: Optional[float],
               y_percent: Optional[float],
               text_area: Optional[Dict[str, Any]],
               font_path: str,
               font_size: int,
               font_color: str) -> Image.Image:
    draw = ImageDraw.Draw(img)
    rx, ry, rw, rh = _resolve_target(img, x_percent, y_percent, text_area)

    # clamp rect to image bounds
    rx = max(0, min(rx, img.size[0] - 1))
    ry = max(0, min(ry, img.size[1] - 1))
    rw = max(1, min(rw, img.size[0] - rx))
    rh = max(1, min(rh, img.size[1] - ry))

    # auto-fit font to rectangle
    pad_x = max(2, int(rw * 0.04))
    pad_y = max(2, int(rh * 0.15))
    max_w = max(1, rw - 2 * pad_x)
    max_h = max(1, rh - 2 * pad_y)

    font = _fit_font_size(draw, name, font_path, font_size, max_w, max_h)
    tw, th = _measure(draw, name, font)

    # center text inside rectangle
    tx = rx + (rw - tw) / 2
    ty = ry + (rh - th) / 2

    draw.text((tx, ty), name, font=font, fill=font_color)
    return img


def render_preview(template_path: str,
                   name: str,
                   x_percent: Optional[float],
                   y_percent: Optional[float],
                   text_area: Optional[Dict[str, Any]],
                   font_path: str,
                   font_size: int,
                   font_color: str,
                   output_path: str,
                   bold: bool = False,
                   italic: bool = False) -> None:
    # bold/italic ignored for now (kept for API compatibility)
    img = _load_image(template_path).copy()
    img = _draw_name(img, name, x_percent, y_percent, text_area, font_path, font_size, font_color)
    img.convert("RGB").save(output_path, "PNG")


def render_certificate(template_path: str,
                       name: str,
                       x_percent: Optional[float],
                       y_percent: Optional[float],
                       text_area: Optional[Dict[str, Any]],
                       font_path: str,
                       font_size: int,
                       font_color: str,
                       output_path: str,
                       output_format: str = "png",
                       bold: bool = False,
                       italic: bool = False) -> None:
    img = _load_image(template_path).copy()
    img = _draw_name(img, name, x_percent, y_percent, text_area, font_path, font_size, font_color)

    fmt = (output_format or "png").lower().strip()

    if fmt == "png":
        img.convert("RGB").save(output_path, "PNG")
        return

    if fmt in ("jpg", "jpeg"):
        img.convert("RGB").save(output_path, "JPEG")
        return

    if fmt == "pdf":
        # True PDF output: save rendered result as a PDF page.
        # This keeps current workflow: generated files go into output/ and get zipped.
        rgb = img.convert("RGB")
        rgb.save(output_path, "PDF", resolution=300.0)
        return

    # fallback
    img.convert("RGB").save(output_path, "PNG")


def render_template_thumbnail(template_path: str, output_path: str) -> None:
    img = _load_image(template_path)
    img.convert("RGB").save(output_path, "PNG")