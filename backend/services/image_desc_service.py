import logging
import os
import json
import urllib.request
import urllib.error
from PIL import Image

HF_CAPTION_API = "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base"
HF_TOKEN = os.environ.get("HF_TOKEN", "").strip()
_LOCAL_MODEL = None


def _describe_via_hf_api(image_path: str) -> str | None:
    try:
        with open(image_path, "rb") as f:
            image_bytes = f.read()

        headers = {"Content-Type": "application/octet-stream"}
        if HF_TOKEN:
            headers["Authorization"] = f"Bearer {HF_TOKEN}"

        req = urllib.request.Request(
            HF_CAPTION_API,
            data=image_bytes,
            headers=headers,
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            parsed = json.loads(body)

        if isinstance(parsed, list) and parsed and isinstance(parsed[0], dict):
            caption = parsed[0].get("generated_text")
            if caption:
                return caption
        if isinstance(parsed, dict) and parsed.get("generated_text"):
            return str(parsed["generated_text"])
        return None
    except urllib.error.HTTPError as exc:
        err_body = exc.read().decode("utf-8") if exc.fp else ""
        logging.warning(f"HF caption API HTTPError {exc.code}: {err_body}")
        return None
    except Exception as exc:
        logging.warning(f"HF caption API failed: {exc}")
        return None


def _load_local_model():
    global _LOCAL_MODEL
    if _LOCAL_MODEL is not None:
        return _LOCAL_MODEL
    try:
        from transformers import BlipProcessor, BlipForConditionalGeneration
        logging.info("Loading local BLIP model fallback...")
        processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
        model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")
        _LOCAL_MODEL = (processor, model)
        return _LOCAL_MODEL
    except Exception as exc:
        logging.error(f"Failed to load local Image Description model fallback: {exc}")
        return None

def describe_image(image_path: str) -> str:
    """
    Takes an image file path and returns a descriptive caption using BLIP.
    """
    try:
        # Preferred path: remote API (no local 990MB model download).
        api_caption = _describe_via_hf_api(image_path)
        if api_caption:
            return api_caption

        # Fallback path: local model if API unavailable.
        local_model = _load_local_model()
        if local_model is None:
            return "Image caption service unavailable right now. Please try again in a moment."

        processor, model = local_model
        pil_image = Image.open(image_path).convert("RGB")
        inputs = processor(pil_image, return_tensors="pt")
        output = model.generate(**inputs)
        caption = processor.decode(output[0], skip_special_tokens=True)
        return caption
    except Exception as exc:
        logging.error(f"Error during image description: {exc}")
        return "Image caption failed for this frame. Please try again."
