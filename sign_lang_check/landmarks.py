"""Shared hand landmark preprocessing (training + live inference must match)."""

import numpy as np


def normalize_hand_xy(landmarks_42: np.ndarray) -> np.ndarray:
    """
    MediaPipe hand: 21 landmarks × (x, y) = 42 values.
    Translate to wrist, scale by max distance from wrist (position/size invariant).
    """
    pts = landmarks_42.reshape(21, 2).astype(np.float32)
    wrist = pts[0:1, :]
    pts = pts - wrist
    scale = float(np.linalg.norm(pts, axis=1).max()) + 1e-6
    pts = pts / scale
    return pts.reshape(-1)
