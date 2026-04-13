import cv2
from utils import distance

class DotConnector:
    def __init__(self, dots):
        self.dots = dots
        self.current_dot = 0
        self.lines = []
        self.closed = False

    def reset(self, new_dots):
        self.dots = new_dots
        self.current_dot = 0
        self.lines = []
        self.closed = False

    def update(self, finger_pos):
        x, y = finger_pos

        if x == 0 and y == 0:
            return

        if self.current_dot < len(self.dots):
            target = self.dots[self.current_dot]

            if distance(finger_pos, target) < 80:
                if self.current_dot > 0:
                    self.lines.append(
                        (self.dots[self.current_dot - 1], target)
                    )
                self.current_dot += 1

        elif not self.closed:
            if distance(finger_pos, self.dots[0]) < 80:
                self.lines.append((self.dots[-1], self.dots[0]))
                self.closed = True

    def draw(self, frame):
        for i, dot in enumerate(self.dots):

            color = (0, 0, 255)
            if i == self.current_dot:
                color = (0, 255, 255)

            cv2.circle(frame, dot, 20, color, -1)

            cv2.putText(frame, str(i+1),
                        (dot[0]-10, dot[1]-10),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6, (255,255,255), 2)

        for line in self.lines:
            cv2.line(frame, line[0], line[1], (255,0,0), 5)

        if self.closed:
            cv2.putText(frame, "Shape Completed!",
                        (120, 60),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        1, (0,255,0), 3)

        return frame