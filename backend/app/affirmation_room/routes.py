from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .affirmation_agent import generate_affirmation
from app.models.grounded_affirmation_model import GroundedAffirmationExchange
import uuid

affirmation_room_bp = Blueprint('affirmation_room', __name__, url_prefix='/api/affirmation-room')

@affirmation_room_bp.route('/respond', methods=['POST'])
@jwt_required(optional=True)
def respond():
    """
    POST /api/affirmation-room/respond
    Body: {"player_statement": str, "session_id": str (optional)}
    """
    try:
        data = request.get_json() or {}
        player_statement = data.get("player_statement")
        session_id = data.get("session_id") or str(uuid.uuid4())

        if not player_statement:
            return jsonify({
                "error": "Bad Request",
                "message": "Missing required field 'player_statement'."
            }), 400

        result = generate_affirmation(player_statement)

        # Store only if it was successful and didn't trigger human safety support
        if not result.get("needs_human_support"):
            user_id = get_jwt_identity()  # returns None if not logged in or anonymous
            exchange = GroundedAffirmationExchange(
                user_id=user_id,
                session_id=session_id,
                player_statement=player_statement,
                acknowledgment=result.get("acknowledgment"),
                validation=result.get("validation"),
                grounded_hope=result.get("grounded_hope"),
                full_response=result.get("full_response")
            )
            exchange.save()

        return jsonify(result), 200

    except Exception as e:
        print(f"[Affirmation Room Exception] Error in routes: {e}")
        return jsonify({
            "error": "Failed to generate affirmation",
            "message": "The Saint is deep in meditation and could not respond. Please try again."
        }), 502
