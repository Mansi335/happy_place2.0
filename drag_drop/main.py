import cv2
import mediapipe as mp
import os
import random

# 🔥 suppress logs (optional)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

# Initialize camera (Mac fix)
cap = cv2.VideoCapture(0, cv2.CAP_AVFOUNDATION)

# 🔥 MediaPipe setup (STABLE VERSION)
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,  # Video mode gives smoother tracking
    max_num_hands=1,
    model_complexity=0,
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6
)

mp_draw = mp.solutions.drawing_utils

# Game state
obj_x, obj_y = 200, 200
dragging = False
score = 0
drop_message_frames = 0
smooth_x, smooth_y = None, None
SMOOTHING = 0.25

# Basket area (updated each round)
basket_x1, basket_y1 = 400, 250
basket_x2, basket_y2 = 600, 450
basket_w, basket_h = 180, 150


def reset_round(frame_w, frame_h):
    global obj_x, obj_y, basket_x1, basket_y1, basket_x2, basket_y2, dragging

    margin = 60
    obj_x = random.randint(margin, frame_w - margin)
    obj_y = random.randint(margin, frame_h - margin)

    basket_x1 = random.randint(margin, frame_w - basket_w - margin)
    basket_y1 = random.randint(margin, frame_h - basket_h - margin)
    basket_x2 = basket_x1 + basket_w
    basket_y2 = basket_y1 + basket_h

    # Keep object outside basket on spawn
    if basket_x1 < obj_x < basket_x2 and basket_y1 < obj_y < basket_y2:
        obj_x = max(margin, basket_x1 - 80)
        obj_y = max(margin, basket_y1 - 80)

    dragging = False

while True:
    ret, frame = cap.read()
    if not ret:
        print("Camera not working")
        break

    frame = cv2.flip(frame, 1)
    h, w, _ = frame.shape

    # MediaPipe expects RGB input for stable hand landmarks
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    results = hands.process(rgb)

    # Hand detection
    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            mp_draw.draw_landmarks(
                frame, hand_landmarks, mp_hands.HAND_CONNECTIONS
            )

            # Index finger tip (landmark 8)
            x = int(hand_landmarks.landmark[8].x * w)
            y = int(hand_landmarks.landmark[8].y * h)

            # Smooth finger coordinates to reduce jitter
            if smooth_x is None or smooth_y is None:
                smooth_x, smooth_y = x, y
            else:
                smooth_x = int((1 - SMOOTHING) * smooth_x + SMOOTHING * x)
                smooth_y = int((1 - SMOOTHING) * smooth_y + SMOOTHING * y)

            # Draw finger
            cv2.circle(frame, (smooth_x, smooth_y), 10, (0, 255, 0), -1)

            # Touch detection
            if abs(smooth_x - obj_x) < 40 and abs(smooth_y - obj_y) < 40:
                dragging = True

            # Drag object
            if dragging:
                # Move object smoothly instead of snapping
                obj_x = int(0.7 * obj_x + 0.3 * smooth_x)
                obj_y = int(0.7 * obj_y + 0.3 * smooth_y)

            # Drop condition
            if basket_x1 < obj_x < basket_x2 and basket_y1 < obj_y < basket_y2:
                score += 1
                drop_message_frames = 30
                dragging = False
                reset_round(w, h)

    # Draw object
    cv2.circle(frame, (obj_x, obj_y), 30, (255, 0, 0), -1)

    # Draw basket
    cv2.rectangle(frame, (basket_x1, basket_y1),
                  (basket_x2, basket_y2), (0, 255, 0), 3)

    # Instruction
    cv2.putText(frame, "Drag object into box", (10,30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,255,255), 2)
    cv2.putText(frame, f"Score: {score}", (10, 60),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    if drop_message_frames > 0:
        cv2.putText(frame, "Correct! New round", (180, 100),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 3)
        drop_message_frames -= 1

    cv2.imshow("Drag Drop Game", frame)

    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()