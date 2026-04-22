import os
import uuid
from werkzeug.datastructures import FileStorage


def save_uploaded_file(uploaded_file: FileStorage, temp_dir: str = "temp") -> str:
    """
    Save uploaded file to temp directory with unique filename.
    Creates directory if it does not exist.
    """
    os.makedirs(temp_dir, exist_ok=True)
    original_name = uploaded_file.filename or "audio_input"
    _, ext = os.path.splitext(original_name)
    ext = ext if ext else ".bin"
    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(temp_dir, filename)
    uploaded_file.save(file_path)
    return file_path
