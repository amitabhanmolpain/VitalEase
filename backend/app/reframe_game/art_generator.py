import os
import io
from google import genai
from google.genai import types
import cloudinary
import cloudinary.uploader

def init_cloudinary():
    """Configures Cloudinary with environment variables."""
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET")
    )

def generate_pixel_art(prompt: str, filename: str) -> str:
    """
    Generates a pixel art image using gemini-2.5-flash-image (Nano Banana),
    uploads it to Cloudinary, and returns the secure URL.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set in the environment variables.")

    client = genai.Client(api_key=api_key)

    # Style suffix to enforce Stardew Valley-like retro pixel-art aesthetic
    style_prompt = f"{prompt}, top-down 16-bit pixel art style, Stardew Valley aesthetic, limited color palette, no anti-aliasing, clean pixel edges"

    config = types.GenerateContentConfig(
        response_modalities=["IMAGE"]
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=style_prompt,
        config=config
    )

    image_bytes = None
    if response.candidates:
        for candidate in response.candidates:
            if candidate.content and candidate.content.parts:
                for part in candidate.content.parts:
                    if part.inline_data and part.inline_data.data:
                        image_bytes = part.inline_data.data
                        break
                if image_bytes:
                    break

    if not image_bytes:
        raise RuntimeError("Failed to retrieve image data from Gemini response.")

    # Configure Cloudinary
    init_cloudinary()

    # Upload the image bytes to Cloudinary
    result = cloudinary.uploader.upload(
        io.BytesIO(image_bytes),
        public_id=f"reframe_game/{filename}",
        folder="reframe_game",
        overwrite=True,
        resource_type="image"
    )

    return result["secure_url"]
