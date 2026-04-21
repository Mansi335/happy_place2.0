from fastapi import APIRouter, UploadFile, File, HTTPException
from ..services.braille_service import process_audio
import shutil
import os
import uuid

router = APIRouter()

TEMP_DIR = "temp_braille_audio"
os.makedirs(TEMP_DIR, exist_ok=True)


@router.post("/")
async def analyze_braille(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No audio file provided")

    file_ext = file.filename.split(".")[-1] if "." in file.filename else "wav"
    temp_filename = f"{uuid.uuid4()}.{file_ext}"
    temp_filepath = os.path.join(TEMP_DIR, temp_filename)

    try:
        with open(temp_filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = process_audio(temp_filepath)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)
