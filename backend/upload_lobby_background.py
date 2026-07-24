import os
import sys
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader

load_dotenv()

LOBBY_PATH = r"C:\Users\ami05\.gemini\antigravity-ide\brain\18d892bc-4d15-46bf-a9db-c61d5048dd89\background_lobby_1784919651983.png"

def init_cloudinary():
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET")
    )

def main():
    print("Uploading lobby background image to Cloudinary...\n")
    init_cloudinary()

    if not os.path.exists(LOBBY_PATH):
        print(f"[-] File not found: {LOBBY_PATH}")
        sys.exit(1)

    try:
        result = cloudinary.uploader.upload(
            LOBBY_PATH,
            public_id="reframe_game/background_lobby",
            folder="reframe_game",
            overwrite=True,
            resource_type="image"
        )
        print(f"[OK] Secure URL: {result['secure_url']}\n")
    except Exception as e:
        print(f"[ERROR] Error uploading: {e}\n")

if __name__ == "__main__":
    main()
