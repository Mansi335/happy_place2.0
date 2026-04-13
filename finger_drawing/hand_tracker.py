import cv2
import mediapipe as mp

class HandTracker:
    def __init__(self):
        self.mp_hands = mp.solutions.hands

        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            model_complexity=0,
            min_detection_confidence=0.3,
            min_tracking_confidence=0.3
        )

        self.mp_draw = mp.solutions.drawing_utils

    def get_finger_position(self, frame):
        h, w, _ = frame.shape

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb)

        x, y = 0, 0

        if results.multi_hand_landmarks:
            for handLms in results.multi_hand_landmarks:
                self.mp_draw.draw_landmarks(
                    frame,
                    handLms,
                    self.mp_hands.HAND_CONNECTIONS
                )

                lm = handLms.landmark[8]
                x = int(lm.x * w)
                y = int(lm.y * h)

        return x, y, frame