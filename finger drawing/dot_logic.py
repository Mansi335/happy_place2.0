import cv2
from utils import distance

class DotConnector:
    def __init__(self, dots):
        self.dots = dots
        self.current_dot = 0
        self.lines = []
        self.closed = False

    def update(self, finger_pos):
        if self.current_dot < len(self.dots):
            if distance(finger_pos, self.dots[self.current_dot]) < 50:
                if self.current_dot > 0:
                    self.lines.append((self.dots[self.current_dot-1], self.dots[self.current_dot]))
                self.current_dot += 1

        elif not self.closed:
            if distance(finger_pos, self.dots[0]) < 50:
                self.lines.append((self.dots[-1], self.dots[0]))
                self.closed = True

    def draw(self, frame):
        for i, dot in enumerate(self.dots):
            cv2.circle(frame, dot, 20, (0,0,255), -1)
            cv2.putText(frame, str(i+1), (dot[0]-10, dot[1]-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 2)

        for line in self.lines:
            cv2.line(frame, line[0], line[1], (255,0,0), 6)

        if self.closed:
            cv2.putText(frame, "Shape Completed!", (200,50),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 3)

        return frame