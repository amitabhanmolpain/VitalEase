import os
import sys
from dotenv import load_dotenv

# Add the script folder to python path so we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.reframe_game.art_generator import generate_pixel_art

load_dotenv()

def main():
    print("Generating pixel art temple pandit asset using Gemini...\n")

    if not os.getenv("GEMINI_API_KEY"):
        print("❌ Error: GEMINI_API_KEY not found in .env file.")
        sys.exit(1)

    prompt = "An Indian temple pandit priest wearing traditional saffron robes, sitting in a cross-legged meditative posture, holding a worship plate with diyas and flowers in front of him, retro pixel art, clean details"
    try:
        url = generate_pixel_art(prompt, "sprite_pandit")
        print(f"\n✅ Secure URL: {url}\n")
    except Exception as e:
        print(f"❌ Error generating pandit sprite: {e}\n")

if __name__ == "__main__":
    main()
