from mongoengine import Document, StringField, DictField, IntField, DateTimeField, ListField
from datetime import datetime


class GeneratedQuestion(Document):
    """Stores AI-generated battle scenarios in MongoDB for reuse and no-repeat logic."""
    level = IntField(required=True)
    difficulty = StringField(required=True)
    enemy = StringField(required=True)
    topic = StringField(default='')
    scenario_data = DictField(required=True)  # Full scenario JSON
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'generated_questions',
        'indexes': ['level', 'difficulty', 'enemy'],
        'ordering': ['-created_at']
    }


class UserQuestionHistory(Document):
    """Tracks which questions a user has already seen to avoid repeats."""
    user_id = StringField(required=True, unique=True)
    seen_question_ids = ListField(StringField(), default=list)  # List of GeneratedQuestion IDs
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'user_question_history',
        'indexes': ['user_id']
    }
