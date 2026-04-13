import numpy as np
import os
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.utils import to_categorical

print("Training script started...", flush=True)

actions = ['Hello', 'ThankYou', 'GoodMorning', 'Sorry', 'HowAreYou']
DATA_PATH = 'dataset'

sequences = []
labels = []

for action in actions:
    folder = os.path.join(DATA_PATH, action)
    print("Reading folder:", folder)

    for file in os.listdir(folder):
        path = os.path.join(folder, file)
        data = np.load(path)
        sequences.append(data[:30])
        labels.append(actions.index(action))

print("Total sequences:", len(sequences))

X = np.array(sequences)
y = to_categorical(labels).astype(int)

print("X shape:", X.shape)
print("y shape:", y.shape)

model = Sequential()
model.add(LSTM(64, return_sequences=True, input_shape=(30,42)))
model.add(LSTM(64))
model.add(Dense(32, activation='relu'))
model.add(Dense(len(actions), activation='softmax'))

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

print("Starting training...", flush=True)

model.fit(X, y, epochs=10)

os.makedirs('model', exist_ok=True)
model.save('model/lstm_model.h5')

print("Model saved successfully")