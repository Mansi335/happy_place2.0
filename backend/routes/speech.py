from flask import Blueprint, jsonify, request

from Speechtotext import process_audio_file
from utils.file_handler import save_uploaded_file


speech_bp = Blueprint("speech", __name__, url_prefix="/speech")


@speech_bp.route("/convert", methods=["POST"])
def convert_speech():
    """
    Accepts multipart form-data with key: audio
    Returns speech-to-text and emotion prediction JSON.
    """
    if "audio" not in request.files:
        return jsonify({"status": "error", "error": "No audio file provided"}), 400

    uploaded_file = request.files["audio"]
    if uploaded_file.filename is None or uploaded_file.filename.strip() == "":
        return jsonify({"status": "error", "error": "Empty file name"}), 400

    try:
        saved_path = save_uploaded_file(uploaded_file, temp_dir="temp")
        output = process_audio_file(saved_path)
        if output.get("status") == "error":
            return jsonify(output), 500
        return jsonify(output), 200
    except Exception as exc:
        return jsonify({"status": "error", "error": str(exc)}), 500
