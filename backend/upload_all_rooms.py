import os
import sys
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader

load_dotenv()

ROOMS_MAPPING = {
    "room_catastrophizing": r"C:\Users\ami05\.gemini\antigravity-ide\brain\18d892bc-4d15-46bf-a9db-c61d5048dd89\room_catastrophizing_1784920857734.png",
    "room_black_white": r"C:\Users\ami05\.gemini\antigravity-ide\brain\18d892bc-4d15-46bf-a9db-c61d5048dd89\room_black_white_1784920881910.png",
    "room_mind_reading": r"C:\Users\ami05\.gemini\antigravity-ide\brain\18d892bc-4d15-46bf-a9db-c61d5048dd89\room_mind_reading_1784920904435.png",
    "room_overgeneralization": r"C:\Users\ami05\.gemini\antigravity-ide\brain\18d892bc-4d15-46bf-a9db-c61d5048dd89\room_overgeneralization_1784920924587.png",
    "room_personalization": r"C:\Users\ami05\.gemini\antigravity-ide\brain\18d892bc-4d15-46bf-a9db-c61d5048dd89\room_personalization_1784920943920.png"
}

def init_cloudinary():
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET")
    )

def main():
    print("Uploading 5 room backgrounds to Cloudinary...\n")
    init_cloudinary()

    for name, path in ROOMS_MAPPING.items():
        if not os.path.exists(path):
            print(f"[-] File not found: {path}")
            continue

        try:
            result = cloudinary.uploader.upload(
                path,
                public_id=f"reframe_game/{name}",
                folder="reframe_game",
                overwrite=True,
                resource_type="image"
            )
            print(f"[OK] {name} secure URL: {result['secure_url']}")
        except Exception as e:
            print(f"[ERROR] Error uploading {name}: {e}")

if __name__ == "__main__":
    main()
