import cv2
from hand_tracker import HandTracker
from dot_logic import DotConnector
from shapes import shapes

cap = cv2.VideoCapture(0)
tracker = HandTracker()

level = 0
connector = None

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)

    # Initialize connector when level starts
    if connector is None:
        connector = DotConnector(shapes[level])

    finger_x, finger_y, frame = tracker.get_finger_position(frame)

    connector.update((finger_x, finger_y))
    frame = connector.draw(frame)

    # Show level
    cv2.putText(frame, f"Level: {level+1}", (50,50),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (255,255,255), 3)

    # If shape closed → next level
    if connector.closed:
        cv2.putText(frame, "Next Shape!", (200,100),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,255), 3)
        cv2.imshow("Finger Drawing", frame)
        cv2.waitKey(1000)

        level += 1
        if level < len(shapes):
            connector = DotConnector(shapes[level])
        else:
            # Game completed
            frame[:] = 0
            cv2.putText(frame, "All Shapes Completed!", (200,300),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 3)
            cv2.imshow("Finger Drawing", frame)
            cv2.waitKey(3000)
            break

    cv2.imshow("Finger Drawing", frame)

    key = cv2.waitKey(1) & 0xFF
    if key == 27:
        break
    if key == ord('r'):  # Restart game
        level = 0
        connector = DotConnector(shapes[level])

cap.release()
cv2.destroyAllWindows()