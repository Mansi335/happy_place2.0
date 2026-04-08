#predict using that model

import cv2
import mediapipe as mp
import numpy as np
from tensorflow.keras.models import load_model

actions = ['Hello', 'ThankYou', 'GoodMorning', 'Sorry', 'HowAreYou']
model = load_model('model/lstm_model.h5')

mp_hands = mp.solutions.hands
hands = mp_hands.Hands()
mp_draw = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0, cv2.CAP_AVFOUNDATION)
sequence = []

import time

# Interactive game variables
target_idx = 0
correct_message_time = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(image)
    
    current_time = time.time()
    
    if target_idx < len(actions):
        target_word = actions[target_idx]
        
        cv2.putText(frame, f"Please sign: {target_word}", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
        
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
                
                landmarks = []
                for lm in hand_landmarks.landmark:
                    landmarks.append(lm.x)
                    landmarks.append(lm.y)
                
                sequence.append(landmarks)
                if len(sequence) > 30:
                    sequence.pop(0)

            if len(sequence) == 30:
                res = model.predict(np.expand_dims(sequence, axis=0), verbose=0)[0]
                predicted_idx = np.argmax(res)
                confidence = res[predicted_idx]
                predicted_word = actions[predicted_idx]
                
                # Show what the AI currently thinks
                cv2.putText(frame, f"Seeing: {predicted_word} ({confidence:.2f})", (10, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                
                # If the AI predicts the correct word, even with loose confidence, move to next!
                if predicted_word == target_word and confidence > 0.4:
                    correct_message_time = time.time()
                    target_idx += 1
                    sequence = [] # Clear memory for next sign
                    
        # Display success message as an overlay for 1.5 seconds WITHOUT pausing completion logic
        if current_time - correct_message_time < 1.5:
            cv2.putText(frame, "Correct!", (150, 400), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 0), 5)

    else:
        cv2.putText(frame, "All signs completed!", (50, 250), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 4)

    # Display keyboard shortcut helper
    cv2.putText(frame, "Press 'n' to skip | 'q' to quit", (10, 450), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

    cv2.imshow('Predict Learning Mode', frame)
    
    key = cv2.waitKey(10) & 0xFF
    if key == ord('q'):
        break
    elif key == ord('n'):
        # Force skip to next word
        if target_idx < len(actions):
            target_idx += 1
            sequence = []

cap.release()
cv2.destroyAllWindows()