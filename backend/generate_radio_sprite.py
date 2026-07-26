import os
import sys
from dotenv import load_dotenv

# Add the script folder to python path so we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.reframe_game.art_generator import generate_pixel_art

load_dotenv()

def main():
    print("Generating pixel art magical radio character asset using Gemini (Nano Banana)...\n")

    if not os.getenv("GEMINI_API_KEY"):
        print("❌ Error: GEMINI_API_KEY not found in .env file.")
        sys.exit(1)

    prompt = "A magical retro vintage radio character with tiny cute hands and tiny legs, small expressive eyes and a happy mouth, standing posture, retro pixel art, clean details"
    try:
        url = generate_pixel_art(prompt, "sprite_magical_radio")
        print(f"\n✅ Secure URL: {url}\n")
    except Exception as e:
        print(f"❌ Error generating magical radio sprite: {e}\n")

if __name__ == "__main__":
    main()
