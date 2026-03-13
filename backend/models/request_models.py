from typing import Literal

from pydantic import BaseModel, Field


class PreviewRequest(BaseModel):
    """Request schema for generating a preview certificate."""

    session_id: str
    x_percent: float = Field(..., ge=0.0, le=100.0, description="Horizontal text position as a percentage of image width (0–100).")
    y_percent: float = Field(..., ge=0.0, le=100.0, description="Vertical text position as a percentage of image height (0–100).")
    font_size: int = Field(..., gt=0, description="Font size in points. Must be a positive integer.")
    font_color: str = Field(..., description="Font color as a 6-digit hex string (e.g. '#000000').")
    font_path: str = Field(..., description="Server-side path to the .ttf or .otf font file.")

    model_config = {
        "json_schema_extra": {
            "example": {
                "session_id": "a3f92a23-91e7-4c4b-b6d1-123abc",
                "x_percent": 50.0,
                "y_percent": 60.0,
                "font_size": 48,
                "font_color": "#000000",
                "font_path": "/fonts/OpenSans-Bold.ttf",
            }
        }
    }


class GenerateRequest(BaseModel):
    """Request schema for bulk certificate generation."""

    session_id: str
    x_percent: float = Field(..., ge=0.0, le=100.0, description="Horizontal text position as a percentage of image width (0–100).")
    y_percent: float = Field(..., ge=0.0, le=100.0, description="Vertical text position as a percentage of image height (0–100).")
    font_size: int = Field(..., gt=0, description="Font size in points. Must be a positive integer.")
    font_color: str = Field(..., description="Font color as a 6-digit hex string (e.g. '#000000').")
    font_path: str = Field(..., description="Server-side path to the .ttf or .otf font file.")
    output_format: Literal["png", "jpg", "pdf"] = Field(
        ...,
        description="Output file format for generated certificates. Allowed: png, jpg, pdf.",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "session_id": "a3f92a23-91e7-4c4b-b6d1-123abc",
                "x_percent": 50.0,
                "y_percent": 60.0,
                "font_size": 48,
                "font_color": "#000000",
                "font_path": "/fonts/OpenSans-Bold.ttf",
                "output_format": "png",
            }
        }
    }


class DownloadResponse(BaseModel):
    """Response model returned when certificates are ready for download."""

    download_url: str = Field(..., description="URL to download the zipped certificates.")
    file_name: str = Field(..., description="Name of the ZIP file available for download.")

    model_config = {
        "json_schema_extra": {
            "example": {
                "download_url": "/download/a3f92a23-91e7-4c4b-b6d1-123abc/certificates.zip",
                "file_name": "certificates.zip",
            }
        }
    }