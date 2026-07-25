import os
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader

load_dotenv()

LEFT_WING_FLOORS = {
    "background_left_wing_floor_2": r"C:\Users\ami05\.gemini\antigravity-ide\brain\18d892bc-4d15-46bf-a9db-c61d5048dd89\left_wing_floor_2_1784980495647.png",
    "background_left_wing_floor_3": r"C:\Users\ami05\.gemini\antigravity-ide\brain\18d892bc-4d15-46bf-a9db-c61d5048dd89\left_wing_floor_3_1784980513885.png"
}

def init_cloudinary():
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET")
    )

def main():
    print("Uploading Left Wing upper floor backgrounds to Cloudinary...\n")
    init_cloudinary()

    for name, path in LEFT_WING_FLOORS.items():
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
