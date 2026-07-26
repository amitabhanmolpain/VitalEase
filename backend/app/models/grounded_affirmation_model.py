from mongoengine import Document, StringField, DateTimeField
from datetime import datetime

class GroundedAffirmationExchange(Document):
    user_id = StringField(null=True)
    session_id = StringField(null=True)
    player_statement = StringField(required=True)
    acknowledgment = StringField(null=True)
    validation = StringField(null=True)
    grounded_hope = StringField(null=True)
    full_response = StringField(null=True)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'grounded_affirmation_exchanges',
        'indexes': ['user_id', 'session_id', '-created_at'],
        'ordering': ['-created_at']
    }
