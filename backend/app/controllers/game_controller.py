from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user_models import User
from app.models.user_game_profile import UserGameProfile, GameScore
from mongoengine import Q
from datetime import datetime

game_bp = Blueprint('game', __name__)

def get_or_create_profile(user):
    profile = UserGameProfile.objects(user=user).first()
    if not profile:
        profile = UserGameProfile(user=user)
        profile.save()
    return profile

def update_badges(profile):
    badges = set(profile.badges)
    if profile.xp >= 500:
        badges.add('Pro')
    if profile.level >= 5:
        badges.add('Level 5')
    if profile.xp > 0:
        badges.add('Starter')
    profile.badges = list(badges)
    profile.save()

@game_bp.route('/api/game/submit', methods=['POST'])
@jwt_required()
def submit_game():
    user_id = get_jwt_identity()
    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    data = request.get_json()
    game_name = data.get('game_name')
    score = int(data.get('score', 0))
    xp_earned = int(data.get('xp_earned', 0))
    if not game_name:
        return jsonify({'error': 'Missing game_name'}), 400
    # Save game score with error handling
    try:
        GameScore(user=user, game_name=game_name, score=score, xp_earned=xp_earned).save()
    except Exception as e:
        print(f"[GameScore Save Error] {e}")
        return jsonify({'error': 'Failed to save game score', 'details': str(e)}), 500
    # Update profile
    try:
        profile = get_or_create_profile(user)
        profile.xp += xp_earned
        profile.total_score += score
        # Level logic: every 100 XP = 1 level
        while profile.xp >= profile.level * 100:
            profile.xp -= profile.level * 100
            profile.level += 1
        update_badges(profile)
        profile.updated_at = datetime.utcnow()
        profile.save()
    except Exception as e:
        print(f"[UserGameProfile Save Error] {e}")
        return jsonify({'error': 'Failed to update user profile', 'details': str(e)}), 500
    return jsonify({
        'xp': profile.xp,
        'level': profile.level,
        'total_score': profile.total_score,
        'badges': profile.badges
    }), 200

@game_bp.route('/api/game/leaderboard', methods=['GET'])
def leaderboard():
    from app.services.redis_service import redis_client
    import json

    # Try Redis cache first (cache for 30 seconds)
    cache_key = "leaderboard:top10"
    cached = redis_client.get(cache_key)
    if cached:
        return jsonify(json.loads(cached)), 200

    top_profiles = UserGameProfile.objects.order_by('-level', '-xp', '-total_score').limit(10)
    result = []

    # Also pull Thought Battle-specific stats from PlayerStats
    from app.models.player_stats_model import PlayerStats

    for p in top_profiles:
        entry = {
            'user_id': str(p.user.id),
            'name': p.user.name,
            'level': p.level,
            'xp': p.xp,
            'total_score': p.total_score,
            'badges': p.badges
        }
        # Enrich with Thought Battle game-specific stats
        try:
            ps = PlayerStats.objects(user_id=str(p.user.id)).first()
            if ps and ps.games.get('thoughtbattle'):
                tb = ps.games['thoughtbattle']
                entry['thoughtbattle'] = {
                    'level': tb.get('level', 1),
                    'xp': tb.get('xp', 0),
                    'victories': tb.get('victories', 0),
                    'losses': tb.get('losses', 0),
                    'current_streak': tb.get('current_streak', 0)
                }
        except Exception:
            pass
        result.append(entry)

    response_data = {'leaderboard': result}
    # Cache for 30 seconds
    redis_client.set(cache_key, json.dumps(response_data), ex=30)
    return jsonify(response_data), 200

@game_bp.route('/api/game/me', methods=['GET'])
@jwt_required()
def my_progress():
    user_id = get_jwt_identity()
    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    profile = get_or_create_profile(user)
    return jsonify({
        'xp': profile.xp,
        'level': profile.level,
        'total_score': profile.total_score,
        'badges': profile.badges
    }), 200