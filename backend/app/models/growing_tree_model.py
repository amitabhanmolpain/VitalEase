from mongoengine import Document, StringField, IntField, DateTimeField, BooleanField
from datetime import datetime

class GrowingTreeState(Document):
    user_id = StringField(required=True, unique=True)
    tree_growth = IntField(default=10) # 0 to 100 or higher
    current_mood = StringField(default="")
    current_task = StringField(default="")
    task_difficulty = IntField(default=1) # 1 = gentle, 2 = medium, 3 = challenging
    task_status = StringField(default="pending") # "pending", "completed", "skipped"
    last_updated = DateTimeField(default=datetime.utcnow)

    meta = {'collection': 'growing_tree_states'}

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'tree_growth': self.tree_growth,
            'current_mood': self.current_mood,
            'current_task': self.current_task,
            'task_difficulty': self.task_difficulty,
            'task_status': self.task_status,
            'last_updated': self.last_updated.isoformat()
        }
