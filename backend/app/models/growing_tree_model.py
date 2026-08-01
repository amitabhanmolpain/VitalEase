from mongoengine import Document, StringField, IntField, DateTimeField, ListField, DictField, BooleanField
from datetime import datetime

class GrowingTreeState(Document):
    user_id = StringField(required=True, unique=True)
    tree_growth = IntField(default=0)  # Growth from 0 to 100
    current_mood = StringField(default="")
    acknowledgment = StringField(default="")
    tasks = ListField(DictField(), default=list)  # List of generated tasks: {"id": str, "text": str, "size": int, "completed": bool}
    needs_human_support = BooleanField(default=False)
    support_message = StringField(default="")
    last_updated = DateTimeField(default=datetime.utcnow)
    
    # Legacy fields to support backward compatibility with documents in MongoDB
    task_status = StringField(default="")
    current_task = StringField(default="")
    task_difficulty = IntField(default=1)

    meta = {
        'collection': 'growing_tree_states',
        'strict': False
    }

    def to_dict(self):
        tasks_list = self.tasks if self.tasks is not None else []
        completed_tasks = [t for t in tasks_list if isinstance(t, dict) and t.get('completed', False)]
        remaining_tasks = [t for t in tasks_list if isinstance(t, dict) and not t.get('completed', False)]
        return {
            'user_id': self.user_id,
            'tree_growth': self.tree_growth or 0,
            'current_mood': self.current_mood or "",
            'acknowledgment': self.acknowledgment or "",
            'tasks': tasks_list,
            'completed_tasks': completed_tasks,
            'remaining_tasks': remaining_tasks,
            'needs_human_support': self.needs_human_support or False,
            'support_message': self.support_message or "",
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }
