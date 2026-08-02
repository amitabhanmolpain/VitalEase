from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.growing_tree_model import GrowingTreeState
from app.services.tree_task_generator import generate_task_list
from datetime import datetime

growing_tree_bp = Blueprint('growing_tree', __name__, url_prefix='/api/growing-tree')

@growing_tree_bp.route('/state', methods=['GET'])
@jwt_required()
def get_tree_state():
    try:
        user_id = get_jwt_identity()
        state = GrowingTreeState.objects(user_id=user_id).first()
        if not state:
            state = GrowingTreeState(user_id=user_id, tree_growth=0, tasks=[])
            state.save()
        return jsonify(state.to_dict()), 200
    except Exception as e:
        print(f"[Growing Tree State Error] {e}")
        return jsonify({
            "tree_growth": 0,
            "completed_tasks": [],
            "remaining_tasks": [],
            "tasks": [],
            "current_mood": "",
            "acknowledgment": "",
            "needs_human_support": False,
            "support_message": ""
        }), 200

@growing_tree_bp.route('/generate-tasks', methods=['POST'])
@jwt_required()
def generate_tasks():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    player_statement = data.get('player_statement', '').strip()

    if not player_statement:
        return jsonify({'msg': 'Statement is required.'}), 400

    try:
        # Generate tasks & safety evaluation
        result = generate_task_list(player_statement)

        state = GrowingTreeState.objects(user_id=user_id).first()
        if not state:
            state = GrowingTreeState(user_id=user_id)

        state.current_mood = player_statement
        state.last_updated = datetime.utcnow()

        if result.get("needs_human_support"):
            state.needs_human_support = True
            state.support_message = result.get("message")
            state.tasks = []
            state.acknowledgment = ""
            state.save()
            return jsonify({
                "needs_human_support": True,
                "message": result.get("message")
            }), 200

        # Normal flow
        state.needs_human_support = False
        state.support_message = ""
        state.acknowledgment = result.get("acknowledgment", "Let's take things one step at a time.")
        
        # Format task structure for state tracking
        formatted_tasks = []
        for task in result.get("tasks", []):
            formatted_tasks.append({
                "id": str(task.get("id")),
                "text": task.get("text"),
                "size": int(task.get("size", 1)),
                "completed": False
            })
        state.tasks = formatted_tasks
        state.save()

        return jsonify({
            "tasks": state.tasks,
            "acknowledgment": state.acknowledgment
        }), 200

    except Exception as e:
        print(f"[Growing Tree Route Error] {e}")
        return jsonify({
            "tasks": [
                {"id": "t1", "text": "Drink a glass of water.", "size": 1},
                {"id": "t2", "text": "Sit down comfortably for a few minutes.", "size": 1},
                {"id": "t3", "text": "Take a short walk or stretch.", "size": 2}
            ],
            "acknowledgment": "I hear you. Let's take things slow today with a few tiny tasks."
        }), 200

@growing_tree_bp.route('/complete-task', methods=['POST'])
@jwt_required()
def complete_task():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    task_id = data.get('task_id')
    task_size = data.get('task_size', 1)  # Accept size from frontend as fallback

    if not task_id:
        return jsonify({'msg': 'task_id is required.'}), 400

    try:
        state = GrowingTreeState.objects(user_id=user_id).first()
        if not state:
            # No saved state (e.g. MongoDB just started or fallback tasks were used)
            # Return a synthetic success so the frontend can still update locally
            growth_increment = int(task_size) * 10
            return jsonify({
                'tree_growth': min(100, growth_increment),
                'tasks': [],
                'completed_tasks': [],
                'remaining_tasks': [],
                'acknowledgment': '',
                'needs_human_support': False,
                'support_message': '',
                'current_mood': ''
            }), 200

        # Find the task, mark as completed, and scale growth
        task_found = False
        updated_tasks = []

        for task in state.tasks:
            if str(task.get('id')) == str(task_id):
                if not task.get('completed'):
                    task['completed'] = True
                    task_size = int(task.get('size', 1))
                    task_found = True
            updated_tasks.append(task)

        if not task_found:
            return jsonify({'msg': 'Task not found or already completed.'}), 400

        state.tasks = updated_tasks
        growth_increment = task_size * 10
        state.tree_growth = min(100, state.tree_growth + growth_increment)
        state.last_updated = datetime.utcnow()
        state.save()

        return jsonify(state.to_dict()), 200

    except Exception as e:
        print(f"[Growing Tree Complete Error] {e}")
        # Return a synthetic success so the UI doesn't get stuck
        growth_increment = int(task_size) * 10 if isinstance(task_size, int) else 10
        return jsonify({
            'tree_growth': growth_increment,
            'tasks': [],
            'completed_tasks': [],
            'remaining_tasks': [],
            'acknowledgment': '',
            'needs_human_support': False,
            'support_message': '',
            'current_mood': ''
        }), 200
