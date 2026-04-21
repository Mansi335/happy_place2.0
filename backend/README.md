# Assistive Hub Backend Integration Guide

This guide explains how to migrate your existing ML modules into the FastAPI backend and connect them to the Next.js frontend.

## Step 1: Create a Service
Your existing standalone scripts (like `Sign_lang_trans/sign_lang.py`) usually contain a `while True` loop that reads from your webcam (`cv2.VideoCapture`). In a web architecture, the video comes from the user's browser, so the backend only processes frames on demand.

Create a file in `backend/services/` (e.g., `sign_lang_service.py`):
1. **Initialize models conditionally**: Load your ML models (TensorFlow, MediaPipe, transformers) once at the top of the file.
2. **Create a processing function**: Write a function that takes an input (image path, audio file, or a single video frame array) and returns the ML prediction.
*Note: Remove `cv2.VideoCapture()` and `cv2.imshow()` from the service.*

## Step 2: Create an API Route
Create a file in `backend/routes/` (e.g., `sign_lang.py`):
1. Import `APIRouter` from `fastapi`.
2. Define your endpoint:
   - Use `POST` routes for static files (e.g., Image Description, Audio files).
   - Use `WebSocket` routes for continuous data (e.g., Live Sign Language translation or finger drawing).
3. Call your service function inside the route.
4. If it's a file upload, save it temporarily (`shutil.copyfileobj`), pass the path to the service, and then delete the temporary file after processing.

## Step 3: Register the Route in `app.py`
Open `backend/app.py` and register the new route:
```python
from routes import sign_lang

app.include_router(sign_lang.router, prefix="/api/sign-language", tags=["Sign Language"])
```

## Step 4: Call it from the Next.js Frontend
In your Next.js application (`frontend/app/`):
- **For POST Requests**: Use `fetch`, pass the file in a `FormData` object, and handle the JSON response. (See `frontend/app/speech-to-text/page.tsx` for an example).
- **For WebSockets (Video Steaming)**: Use `navigator.mediaDevices.getUserMedia` to get the camera, draw frames onto a `<canvas>`, and use `websocket.send(canvas.toDataURL('image/jpeg'))` to push frames to the backend continuously.

## Running the Backend
1. Create a virtual environment: `python -m venv venv`
2. Activate it: `source venv/bin/activate` 
3. Install dependencies: `pip install -r requirements.txt`
4. Start the server: `uvicorn app:app --reload`

## Important Note on Dependencies
Some packages like `pydub` (used for audio conversion) might require system libraries like `ffmpeg` to be installed on your OS via Homebrew (`brew install ffmpeg`).
