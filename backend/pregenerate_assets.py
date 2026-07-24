import os
import sys
from dotenv import load_dotenv

# Add the script folder to python path so we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.reframe_game.art_generator import generate_pixel_art

load_dotenv()

sprites_prompts = {
    "catastrophizing": "a shadowy hooded figure made of dark swirling mist, anxious posture",
    "black_and_white": "a figure split visually down the middle, one half stark white, one half stark black",
    "mind_reading": "a figure with large watchful eyes peering from shadow",
    "overgeneralization": "a figure trailing repeating faint copies of itself, looped motion blur",
    "personalization": "a hunched figure carrying a heavy glowing weight on its back"
}

def main():
    print("Pre-generating pixel art character assets...\n")

    if not os.getenv("GEMINI_API_KEY"):
        print("❌ Error: GEMINI_API_KEY not found in .env file.")
        sys.exit(1)

    generated_urls = {}
    for key, prompt in sprites_prompts.items():
        print(f"Generating image for '{key}': '{prompt}'...")
        try:
            url = generate_pixel_art(prompt, f"sprite_{key}")
            generated_urls[key] = url
            print(f"✅ Secure URL: {url}\n")
        except Exception as e:
            print(f"❌ Error generating '{key}': {e}\n")

    print("\n" + "="*80)
    print("FINISHED! CLOUDINARY SPRITE URLS:")
    print("="*80)
    for key, url in generated_urls.items():
        print(f'"{key}": "{url}",')
    print("="*80)

if __name__ == "__main__":
    main()
