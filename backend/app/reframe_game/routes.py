from flask import Blueprint, request, jsonify, send_file
from .gemini_client import evaluate_reframe
from .art_generator import generate_pixel_art
import uuid

reframe_game_bp = Blueprint('reframe_game', __name__, url_prefix='/api/reframe-game')

# Fixed set of 5 CBT distortion types
DISTORTION_TYPES = {
    "catastrophizing": "assuming the worst possible outcome will happen",
    "black_and_white": "seeing things as all good or all bad, no middle ground",
    "mind_reading": "assuming you know what others think, usually negatively",
    "overgeneralization": "treating one bad event as a permanent pattern",
    "personalization": "blaming yourself for things outside your control"
}

@reframe_game_bp.route('/distortion-types', methods=['GET'])
def get_distortion_types():
    """
    Returns the fixed list of 5 cognitive distortion types and their descriptions.
    """
    return jsonify(DISTORTION_TYPES), 200

@reframe_game_bp.route('/judge-reframe', methods=['POST'])
def judge_reframe():
    """
    Judges whether the player's reframe addresses the cognitive distortion using Gemini.
    """
    data = request.get_json() or {}
    
    distortion_type = data.get("distortion_type")
    monster_statement = data.get("monster_statement")
    player_reframe = data.get("player_reframe")
    
    # 1. Validation: check if all fields are present
    if not distortion_type or not monster_statement or not player_reframe:
        return jsonify({
            "error": "Bad Request",
            "message": "Missing required fields. Please provide 'distortion_type', 'monster_statement', and 'player_reframe'."
        }), 400

    # 2. Validation: check if distortion_type is valid
    if distortion_type not in DISTORTION_TYPES:
        return jsonify({
            "error": "Bad Request",
            "message": f"Invalid distortion_type. Must be one of: {', '.join(DISTORTION_TYPES.keys())}."
        }), 400

    # 3. Call Gemini to judge the reframe
    try:
        result = evaluate_reframe(
            distortion_type=distortion_type,
            monster_statement=monster_statement,
            player_reframe=player_reframe
        )
    except Exception as e:
        # Gracefully handle Gemini failures / missing api key
        print(f"[Gemini Error] {e}")
        return jsonify({
            "error": "Gemini Evaluation Failed",
            "message": "We couldn't evaluate your reframe right now. The monster remains undefeated, but please try again in a moment!"
        }), 502

    # 4. Compute damage
    quality_score = result.get("quality_score", 0)
    if quality_score < 30:
        damage = quality_score * 0.2
    else:
        damage = quality_score * 0.8
        
    result["damage"] = round(damage, 2)

    return jsonify(result), 200

@reframe_game_bp.route('/generate-art', methods=['POST'])
def generate_art():
    """
    POST endpoint for admin/dev to generate pixel art assets.
    Payload: {"prompt": str, "asset_type": "background" | "character"}
    """
    data = request.get_json() or {}
    prompt = data.get("prompt")
    asset_type = data.get("asset_type")

    if not prompt or not asset_type:
        return jsonify({
            "error": "Bad Request",
            "message": "Missing required fields. Please provide 'prompt' and 'asset_type'."
        }), 400

    if asset_type not in ["background", "character"]:
        return jsonify({
            "error": "Bad Request",
            "message": "Invalid 'asset_type'. Must be 'background' or 'character'."
        }), 400

    try:
        filename = f"{asset_type}_{uuid.uuid4().hex}"
        image_url = generate_pixel_art(prompt, filename)
        return jsonify({"image_url": image_url}), 200
    except Exception as e:
        print(f"[Art Generation Error] {e}")
        return jsonify({
            "error": "Image Generation Failed",
            "message": str(e)
        }), 502

@reframe_game_bp.route("/speak", methods=["POST"])
def speak():
    """
    Generates speech using ParlerTTS (Indian-accented female voice) and returns WAV file.
    """
    data = request.get_json() or {}
    text = data.get("text", "How can I help you today?")
    
    try:
        from parler_tts import ParlerTTSForConditionalGeneration
        from transformers import AutoTokenizer
        import torch
        import soundfile as sf
        import os

        # Cache model/tokenizer locally
        model = ParlerTTSForConditionalGeneration.from_pretrained(
            "ai4bharat/indic-parler-tts"
        ).to("cuda" if torch.cuda.is_available() else "cpu")

        tokenizer = AutoTokenizer.from_pretrained("ai4bharat/indic-parler-tts")
        description_tokenizer = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)

        description = data.get("description", "Divya speaks in a warm, friendly Indian-accented English tone. The recording is of very high quality with no background noise.")

        input_ids = description_tokenizer(description, return_tensors="pt").input_ids
        prompt_ids = tokenizer(text, return_tensors="pt").input_ids

        generation = model.generate(input_ids=input_ids, prompt_input_ids=prompt_ids)
        audio = generation.cpu().numpy().squeeze()
        
        output_path = os.path.join(os.path.dirname(__file__), "output.wav")
        sf.write(output_path, audio, model.config.sampling_rate)
        
        return send_file(output_path, mimetype="audio/wav")
    except Exception as e:
        print(f"[TTS Error] Failed generating ParlerTTS speech: {e}")
        return jsonify({
            "error": "Failed to generate speech",
            "message": str(e)
        }), 500
