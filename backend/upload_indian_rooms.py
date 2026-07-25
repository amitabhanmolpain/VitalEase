import os
import sys
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader

load_dotenv()

INDIAN_ROOMS = {
    "background_indian_lobby": r"C:\Users\ami05\.gemini\antigravity-ide\brain\18d892bc-4d15-46bf-a9db-c61d5048dd89\background_indian_lobby_1784957501772.png",
    "room_indian_catastrophizing": r"C:\Users\ami05\.gemini\antigravity-ide\brain\18d892bc-4d15-46bf-a9db-c61d5048dd89\room_indian_catastrophizing_1784957525947.png",
    "room_indian_black_white": r"C:\Users\ami05\.gemini\antigravity-ide\brain\18d892bc-4d15-46bf-a9db-c61d5048dd89\room_indian_black_white_1784957544840.png",
    "room_indian_mind_reading": r"C:\Users\ami05\.gemini\antigravity-ide\brain\18d892bc-4d15-46bf-a9db-c61d5048dd89\room_indian_mind_reading_1784957824686.png",
    "room_indian_overgeneralization": r"C:\Users\ami05\.gemini\antigravity-ide\brain\18d892bc-4d15-46bf-a9db-c61d5048dd89\room_indian_overgeneralization_1784957853443.png"
}

def init_cloudinary():
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET")
    )

def main():
    print("Uploading Indian-style backgrounds to Cloudinary...\n")
    init_cloudinary()

    for name, path in INDIAN_ROOMS.items():
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
