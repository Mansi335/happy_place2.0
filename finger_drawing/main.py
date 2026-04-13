import cv2
from hand_tracker import HandTracker
from dot_logic import DotConnector

def run_app():
    tracker = HandTracker()
    cap = cv2.VideoCapture(0)

    # 🎯 Multiple shapes (LEVELS)
    shapes = [
        [(100,100), (400,100), (400,400), (100,400)],  # square
        [(250,100), (400,400), (100,400)],            # triangle
        [(250,100), (300,200), (400,200), (320,280),
         (350,400), (250,320), (150,400), (180,280),
         (100,200), (200,200)]                        # star
    ]

    level = 0
    connector = DotConnector(shapes[level])

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1)

        # 🔥 Finger tracking
        x, y, frame = tracker.get_finger_position(frame)

        # 🔥 Update game logic
        connector.update((x, y))

        # 🔥 Draw game
        frame = connector.draw(frame)

        # 🔥 Draw finger cursor
        if x != 0 and y != 0:
            cv2.circle(frame, (x, y), 10, (0, 255, 0), -1)

        # 🔥 LEVEL SWITCH LOGIC
        if connector.closed:
            cv2.putText(frame, "Next Shape Loading...", (80,80),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 3)

            cv2.imshow("Finger Game", frame)
            cv2.waitKey(1000)

            level += 1

            if level < len(shapes):
                connector.reset(shapes[level])
            else:
                level = 0
                connector.reset(shapes[level])

        cv2.putText(frame, f"Level: {level+1}", (10,40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255,255,255), 2)

        cv2.imshow("Finger Game", frame)

        if cv2.waitKey(1) & 0xFF == 27:
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    run_app()