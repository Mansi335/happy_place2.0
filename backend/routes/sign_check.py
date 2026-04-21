from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.sign_check_service import extract_landmarks, predict_sign
import cv2
import numpy as np
import base64
import json

router = APIRouter()

@router.websocket("/ws")
async def websocket_sign_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    sequence = []
    
    try:
        while True:
            data = await websocket.receive_text()
            # The data is expected to be a base64 encoded image e.g. "data:image/jpeg;base64,..."
            if "," in data:
                encoded_data = data.split(',')[1]
                
                # Decode base64 to numpy array
                nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if img is not None:
                    image_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                    
                    # Extract Landmarks
                    landmarks = extract_landmarks(image_rgb)
                    
                    if landmarks:
                        sequence.append(landmarks)
                        if len(sequence) > 30:
                            sequence.pop(0)

                    # Predict
                    if len(sequence) == 30:
                        result = predict_sign(sequence)
                        await websocket.send_json(result)
                    else:
                        await websocket.send_json({"word": None, "confidence": 0.0, "status": f"Gathering frames: {len(sequence)}/30"})

    except WebSocketDisconnect:
        print("Client disconnected from Sign Language WebSocket")
    except Exception as e:
        print(f"WebSocket Error: {e}")
        try:
            await websocket.close()
        except:
            pass
