from fastapi import APIRouter, UploadFile, File, HTTPException
from services.image_desc_service import describe_image
import shutil
import os
import uuid

router = APIRouter()

TEMP_DIR = "temp_images"
os.makedirs(TEMP_DIR, exist_ok=True)

@router.post("/")
async def analyze_image(file: UploadFile = File(...)):
    """
    Endpoint that accepts an image file and returns a descriptive caption.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No image file provided")

    file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    temp_filename = f"{uuid.uuid4()}.{file_ext}"
    temp_filepath = os.path.join(TEMP_DIR, temp_filename)
    
    try:
        with open(temp_filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        caption = describe_image(temp_filepath)
        return {"caption": caption}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)
