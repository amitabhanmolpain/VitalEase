import os
import sys
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader

load_dotenv()

SPRITE_PATH = r"C:\Users\ami05\.gemini\antigravity-ide\brain\fa63bf97-50c2-4acd-850a-2ac67da2eb4b\sprite_pandit_meditating_1785009992709.png"

def init_cloudinary():
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET")
    )

def main():
    print("Uploading meditating pandit sprite to Cloudinary...\n")
    init_cloudinary()

    if not os.path.exists(SPRITE_PATH):
        print(f"[-] File not found: {SPRITE_PATH}")
        sys.exit(1)

    try:
        result = cloudinary.uploader.upload(
            SPRITE_PATH,
            public_id="reframe_game/sprite_pandit_meditating",
            folder="reframe_game",
            overwrite=True,
            resource_type="image"
        )
        print(f"[OK] Secure URL: {result['secure_url']}\n")
    except Exception as e:
        print(f"[ERROR] Error uploading: {e}\n")

if __name__ == "__main__":
    main()
