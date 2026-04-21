from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import subprocess
import sys
import os
import random
import atexit
import json
import urllib.request
import urllib.error

app = Flask(__name__)
CORS(app)

# allow importing from project root
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(ROOT_DIR)

SIGN_LANG_BASE_URL = "http://127.0.0.1:5001"
SIGN_LANG_PORT = "5001"
SIGN_SERVER_PROCESS = None


def _ml_env_python():
    candidates = [
        os.path.join(ROOT_DIR, "ml_env", "bin", "python"),
        os.path.join(ROOT_DIR, "ml_env", "bin", "python3"),
        "python3",
        "python",
    ]
    for candidate in candidates:
        if os.path.isabs(candidate):
            if os.path.exists(candidate):
                return candidate
        else:
            return candidate
    return "python3"


def _is_sign_server_alive():
    try:
        with urllib.request.urlopen(f"{SIGN_LANG_BASE_URL}/health", timeout=1.5) as resp:
            return resp.status == 200
    except Exception:
        return False


def ensure_sign_server():
    global SIGN_SERVER_PROCESS

    if _is_sign_server_alive():
        return True

    if SIGN_SERVER_PROCESS is not None and SIGN_SERVER_PROCESS.poll() is None:
        return True

    python_exec = _ml_env_python()
    server_script = os.path.join(ROOT_DIR, "sign_lang_check", "server.py")
    env = os.environ.copy()
    env["SIGN_LANG_PORT"] = SIGN_LANG_PORT
    # Prevent Flask reloader socket inheritance from parent process.
    env.pop("WERKZEUG_RUN_MAIN", None)
    env.pop("WERKZEUG_SERVER_FD", None)
    env.pop("FLASK_RUN_FROM_CLI", None)

    SIGN_SERVER_PROCESS = subprocess.Popen(
        [python_exec, server_script],
        cwd=ROOT_DIR,
        env=env,
    )
    return True


def _stop_sign_server():
    global SIGN_SERVER_PROCESS
    if SIGN_SERVER_PROCESS is not None and SIGN_SERVER_PROCESS.poll() is None:
        SIGN_SERVER_PROCESS.terminate()
    SIGN_SERVER_PROCESS = None


atexit.register(_stop_sign_server)


def _proxy_to_sign_server(path, method="GET", payload=None):
    ensure_sign_server()
    url = f"{SIGN_LANG_BASE_URL}{path}"

    data = None
    headers = {}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url=url, method=method, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            body = resp.read().decode("utf-8")
            return jsonify(json.loads(body)), resp.status
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8") if exc.fp else "{}"
        try:
            return jsonify(json.loads(body)), exc.code
        except Exception:
            return jsonify({"error": body or "Sign server error"}), exc.code
    except Exception as exc:
        return jsonify({"error": f"Sign server unavailable: {exc}"}), 503

# -------- ROUTES -------- #

@app.route("/")
def home():
    return "Backend Running"

# ✅ Finger Drawing (FIXED - subprocess)
@app.route("/finger-drawing")
def finger_drawing():
    subprocess.Popen(["python", "../finger_drawing/main.py"])
    return jsonify({"message": "Finger Drawing Started"})

# ✅ Drag Drop (FIXED - subprocess)
@app.route("/drag-drop")
def drag_drop():
    subprocess.Popen(["python", "../drag_drop/main.py"])
    return jsonify({"message": "Drag Drop Started"})


# ✅ Sign language proxy routes (runs model server in ml_env)
@app.route("/sign-lang/session", methods=["POST"])
def sign_lang_session():
    return _proxy_to_sign_server("/sign-lang/session", method="POST", payload={})


@app.route("/sign-lang/reset", methods=["POST"])
def sign_lang_reset():
    payload = request.get_json(silent=True) or {}
    return _proxy_to_sign_server("/sign-lang/reset", method="POST", payload=payload)


@app.route("/sign-lang/predict", methods=["POST"])
def sign_lang_predict():
    payload = request.get_json(silent=True) or {}
    return _proxy_to_sign_server("/sign-lang/predict", method="POST", payload=payload)


@app.route("/sign-lang/health", methods=["GET"])
def sign_lang_health():
    return _proxy_to_sign_server("/health", method="GET")


# ✅ Similar Sound game data (for web frontend)
@app.route("/similar-sound", methods=["GET"])
def similar_sound():
    from similar_sound.questions import get_questions

    question = random.choice(get_questions())
    sound_file = os.path.basename(question["sound"])
    return jsonify({
        "sound": sound_file,
        "options": question["options"],
        "correct": question["correct"],
        "sound_url": f"http://127.0.0.1:5000/similar-sound/audio/{sound_file}",
    })


@app.route("/similar-sound/audio/<path:filename>", methods=["GET"])
def similar_sound_audio(filename):
    sounds_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "similar_sound", "assets", "sounds"))
    return send_from_directory(sounds_dir, filename, as_attachment=False)


# -------- RUN -------- #

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)