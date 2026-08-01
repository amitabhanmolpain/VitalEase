from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.growing_tree_model import GrowingTreeState
from app.services.tree_gemini_service import generate_tree_task
from datetime import datetime

growing_tree_bp = Blueprint('growing_tree', __name__, url_prefix='/api/growing-tree')

@growing_tree_bp.route('/state', methods=['GET'])
@jwt_required()
def get_tree_state():
    user_id = get_jwt_identity()
    state = GrowingTreeState.objects(user_id=user_id).first()
    if not state:
        state = GrowingTreeState(user_id=user_id)
        state.save()
    return jsonify(state.to_dict()), 200

@growing_tree_bp.route('/share-mood', methods=['POST'])
@jwt_required()
def share_mood():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    mood = data.get('mood', '').strip()

    if not mood:
        return jsonify({'msg': 'Please share what is on your mind.'}), 400

    state = GrowingTreeState.objects(user_id=user_id).first()
    if not state:
        state = GrowingTreeState(user_id=user_id)

    # Generate task using Gemini AI
    ai_result = generate_tree_task(mood, state.task_difficulty, state.task_status)

    state.current_mood = mood
    state.current_task = ai_result.get('task', 'Sit quietly for a minute.')
    state.task_difficulty = ai_result.get('difficulty', 1)
    state.task_status = 'pending'
    state.last_updated = datetime.utcnow()
    state.save()

    return jsonify(state.to_dict()), 200

@growing_tree_bp.route('/complete-task', methods=['POST'])
@jwt_required()
def complete_task():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    outcome = data.get('outcome') # "completed" or "skipped"

    if outcome not in ['completed', 'skipped']:
        return jsonify({'msg': 'Outcome must be completed or skipped.'}), 400

    state = GrowingTreeState.objects(user_id=user_id).first()
    if not state or state.task_status != 'pending':
        return jsonify({'msg': 'No active task found to complete.'}), 400

    if outcome == 'completed':
        # Growth sized to task difficulty (1 = +5%, 2 = +10%, 3 = +15%)
        growth_increment = state.task_difficulty * 5
        state.tree_growth = min(200, state.tree_growth + growth_increment)
        state.task_status = 'completed'
    else:
        # Skipped / Couldn't do it today -> Stays at same growth, stays friendly
        state.task_status = 'skipped'

    state.last_updated = datetime.utcnow()
    state.save()
    return jsonify(state.to_dict()), 200
