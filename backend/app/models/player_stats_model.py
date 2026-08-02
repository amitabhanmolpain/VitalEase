from mongoengine import Document, StringField, DictField, ListField, DateTimeField
from datetime import datetime

class PlayerStats(Document):
    user_id = StringField(required=True, unique=True)
    global_stats = DictField(default=lambda: {
        'level': 1,
        'xp': 0,
        'victories': 0,
        'losses': 0,
        'current_streak': 0,
        'win_rate': 0.0
    })
    games = DictField(default=dict)  # {game_name: {level, xp, victories, losses, current_streak}}
    achievements = ListField(DictField())  # [{code, title, game, earned_at}]
    badges = ListField(StringField(), default=list)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'player_stats',
        'indexes': ['user_id'],
        'ordering': ['-updated_at']
    }
