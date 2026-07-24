import os
import sys
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader

load_dotenv()

ARTIFACTS_DIR = r"C:\Users\ami05\.gemini\antigravity-ide\brain\18d892bc-4d15-46bf-a9db-c61d5048dd89"

sprites = {
    "catastrophizing": os.path.join(ARTIFACTS_DIR, "sprite_catastrophizing_1784916864094.png"),
    "black_and_white": os.path.join(ARTIFACTS_DIR, "sprite_black_and_white_1784916879515.png"),
    "mind_reading": os.path.join(ARTIFACTS_DIR, "sprite_mind_reading_1784916894081.png"),
    "overgeneralization": os.path.join(ARTIFACTS_DIR, "sprite_overgeneralization_1784916908298.png"),
    "personalization": os.path.join(ARTIFACTS_DIR, "sprite_personalization_1784916924549.png")
}

def init_cloudinary():
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET")
    )

def main():
    print("Uploading pre-generated pixel art sprites to Cloudinary...\n")
    init_cloudinary()

    uploaded_urls = {}
    for key, path in sprites.items():
        if not os.path.exists(path):
            print(f"[-] File not found: {path}")
            continue

        print(f"Uploading '{key}' from {path}...")
        try:
            result = cloudinary.uploader.upload(
                path,
                public_id=f"reframe_game/sprite_{key}",
                folder="reframe_game",
                overwrite=True,
                resource_type="image"
            )
            uploaded_urls[key] = result["secure_url"]
            print(f"[OK] Secure URL: {result['secure_url']}\n")
        except Exception as e:
            print(f"[ERROR] Error uploading '{key}': {e}\n")

    print("\n" + "="*80)
    print("FINISHED! CLOUDINARY SPRITE URLS:")
    print("="*80)
    for key, url in uploaded_urls.items():
        print(f'"{key}": "{url}",')
    print("="*80)

if __name__ == "__main__":
    main()
