import logging
from PIL import Image

try:
    from transformers import BlipProcessor, BlipForConditionalGeneration
    print("Loading BLIP Image Captioning model (this might take a moment if downloading)...")
    processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
    model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")
    print("BLIP Model loaded successfully.")
    MODEL_LOADED = True
except Exception as e:
    logging.error(f"Failed to load Image Description model: {e}")
    MODEL_LOADED = False

def describe_image(image_path: str) -> str:
    """
    Takes an image file path and returns a descriptive caption using BLIP.
    """
    if not MODEL_LOADED:
        return "Model not loaded. Check backend logs."

    try:
        # Load the image using PIL
        pil_image = Image.open(image_path).convert('RGB')
        
        # Generate Caption
        inputs = processor(pil_image, return_tensors="pt")
        output = model.generate(**inputs)
        
        caption = processor.decode(output[0], skip_special_tokens=True)
        return caption
    except Exception as e:
        print(f"Error during image description: {e}")
        return str(e)
