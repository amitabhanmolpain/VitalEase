from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.player_stats_service import (
    get_or_create_stats, update_game_result
)
import json

player_stats_bp = Blueprint('player_stats', __name__)

@player_stats_bp.route('/api/stats', methods=['GET'])
@jwt_required()
def get_stats():
    from app.services.redis_service import redis_client
    user_id = get_jwt_identity()
    redis_key = f"player_stats:{user_id}"
    stats_json = redis_client.get(redis_key)
    if stats_json:
        return Response(stats_json, mimetype='application/json'), 200
    stats = get_or_create_stats(user_id)
    return Response(stats.to_json(), mimetype='application/json'), 200

@player_stats_bp.route('/api/stats/update', methods=['POST'])
@jwt_required()
def update_stats():
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        game = data.get('game')
        win = data.get('win')
        xp = data.get('xp', 0)
        badges = data.get('badges', [])
        if not game or win is None:
            return jsonify({'error': 'Missing game or win'}), 400
        stats = update_game_result(user_id, game, win, xp, badges=badges)
        return Response(stats.to_json(), mimetype='application/json'), 200
    except Exception as e:
        print(f"[Update Stats Error] {e}")
        return jsonify({'error': 'Failed to update stats', 'details': str(e)}), 500

@player_stats_bp.route('/api/stats/achievements', methods=['GET'])
@jwt_required()
def get_achievements():
    user_id = get_jwt_identity()
    stats = get_or_create_stats(user_id)
    return jsonify(stats.achievements or []), 200

@player_stats_bp.route('/api/stats/badges', methods=['GET'])
@jwt_required()
def get_badges():
    user_id = get_jwt_identity()
    stats = get_or_create_stats(user_id)
    return jsonify(stats.badges or []), 200

@player_stats_bp.route('/api/stats/reset-game', methods=['POST'])
@jwt_required()
def reset_game_stats():
    from datetime import datetime
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        game = data.get('game')
        if not game:
            return jsonify({'error': 'Missing game parameter'}), 400

        game_key = str(game).strip().lower()
        stats = get_or_create_stats(user_id)

        # Reset specific game stats
        stats.games[game_key] = {
            'level': 1, 'xp': 0, 'victories': 0, 'losses': 0, 'current_streak': 0
        }

        # Reset global stats too
        stats.global_stats['level'] = 1
        stats.global_stats['xp'] = 0
        stats.global_stats['victories'] = 0
        stats.global_stats['losses'] = 0
        stats.global_stats['current_streak'] = 0
        stats.global_stats['win_rate'] = 0.0

        # Clear achievements and badges
        stats.achievements = []
        stats.badges = []

        # Clear question history so user gets fresh questions on replay
        try:
            from app.models.question_models import UserQuestionHistory
            UserQuestionHistory.objects(user_id=user_id).update_one(
                set__seen_question_ids=[],
                set__updated_at=datetime.utcnow()
            )
        except Exception as e:
            print(f"[Reset] Question history clear error (non-fatal): {e}")

        stats.updated_at = datetime.utcnow()
        stats.save()

        # Update Redis cache
        from app.services.redis_service import redis_client
        redis_key = f"player_stats:{user_id}"
        redis_client.set(redis_key, stats.to_json())

        return Response(stats.to_json(), mimetype='application/json'), 200
    except Exception as e:
        print(f"[Reset Game Stats Error] {e}")
        return jsonify({'error': 'Failed to reset stats', 'details': str(e)}), 500
