from flask import Blueprint, request, jsonify
from .gemini_client import evaluate_reframe

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
