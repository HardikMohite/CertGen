import os
import shutil
from fastapi import UploadFile


async def save_upload_file(upload: UploadFile, destination: str) -> None:
    os.makedirs(os.path.dirname(destination), exist_ok=True)

    # Reset to beginning before copying
    await upload.seek(0)

    with open(destination, "wb") as buffer:
        shutil.copyfileobj(upload.file, buffer)
