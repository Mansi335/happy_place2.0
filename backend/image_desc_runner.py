import json
import os
import sys
import importlib.util

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODEL_FILE = os.path.join(ROOT_DIR, "Assistive_hub", "Image_description", "Imagedes.py")


def _load_model_module():
    spec = importlib.util.spec_from_file_location("assistive_imagedes_module", MODEL_FILE)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load model module from {MODEL_FILE}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing image path"}))
        sys.exit(2)

    image_path = sys.argv[1]
    try:
        module = _load_model_module()
        if not hasattr(module, "describe_image_path"):
            raise RuntimeError("describe_image_path() not found in Imagedes.py")
        caption = module.describe_image_path(image_path)
        print(json.dumps({"caption": caption}))
    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
