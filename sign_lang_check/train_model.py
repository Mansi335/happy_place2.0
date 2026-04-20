import numpy as np
import os
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

print("Training script started...", flush=True)

ACTIONS = ['Hello', 'ThankYou', 'GoodMorning', 'Sorry', 'HowAreYou']
SEQUENCE_LENGTH = 30
LANDMARK_SIZE = 42
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'dataset')
MODEL_DIR = os.path.join(BASE_DIR, 'model')
MODEL_PATH = os.path.join(MODEL_DIR, 'lstm_model.h5')

sequences = []
labels = []

for action in ACTIONS:
    folder = os.path.join(DATA_PATH, action)
    print("Reading folder:", folder)
    if not os.path.isdir(folder):
        print(f"Skipping missing folder: {folder}")
        continue

    for file in os.listdir(folder):
        path = os.path.join(folder, file)
        if not file.endswith(".npy"):
            continue
        data = np.load(path)
        if data.shape != (SEQUENCE_LENGTH, LANDMARK_SIZE):
            print(f"Skipping bad sample {path} with shape {data.shape}")
            continue
        sequences.append(data)
        labels.append(ACTIONS.index(action))

print("Total sequences:", len(sequences))
if not sequences:
    raise RuntimeError("No valid training samples found. Collect data first.")

X = np.array(sequences, dtype=np.float32)
y = to_categorical(labels).astype(int)

print("X shape:", X.shape)
print("y shape:", y.shape)

model = Sequential()
model.add(LSTM(64, return_sequences=True, input_shape=(SEQUENCE_LENGTH, LANDMARK_SIZE)))
model.add(LSTM(64))
model.add(Dense(32, activation='relu'))
model.add(Dense(len(ACTIONS), activation='softmax'))

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

print("Starting training...", flush=True)

callbacks = [
    EarlyStopping(monitor="loss", patience=5, restore_best_weights=True),
    ReduceLROnPlateau(monitor="loss", factor=0.5, patience=2, min_lr=1e-5),
]
model.fit(X, y, epochs=40, callbacks=callbacks, verbose=1)

os.makedirs(MODEL_DIR, exist_ok=True)
model.save(MODEL_PATH)
np.save(os.path.join(MODEL_DIR, "actions.npy"), np.array(ACTIONS))

print("Model saved successfully")