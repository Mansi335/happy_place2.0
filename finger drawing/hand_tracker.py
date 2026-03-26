import cv2
import mediapipe as mp

class HandTracker:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(max_num_hands=1)
        self.mp_draw = mp.solutions.drawing_utils

    def get_finger_position(self, frame):
        h, w, c = frame.shape
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = self.hands.process(rgb)

        finger_x, finger_y = 0, 0

        if result.multi_hand_landmarks:
            for handLms in result.multi_hand_landmarks:
                lm = handLms.landmark[8]
                finger_x = int(lm.x * w)
                finger_y = int(lm.y * h)
                self.mp_draw.draw_landmarks(frame, handLms, self.mp_hands.HAND_CONNECTIONS)

        return finger_x, finger_y, frame