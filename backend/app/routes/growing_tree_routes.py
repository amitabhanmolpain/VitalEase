from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.growing_tree_model import GrowingTreeState
from app.services.tree_task_generator import generate_task_list, generate_task_list_stream
from datetime import datetime
import uuid
import json

growing_tree_bp = Blueprint('growing_tree', __name__, url_prefix='/api/growing-tree')

@growing_tree_bp.route('/state', methods=['GET'])
@jwt_required()
def get_tree_state():
    try:
        user_id = get_jwt_identity()
        state = GrowingTreeState.objects(user_id=user_id).first()
        if not state:
            # Return fresh seed state if no record exists yet
            return jsonify({
                'tree_growth': 0,
                'tasks': [],
                'completed_tasks': [],
                'remaining_tasks': [],
                'acknowledgment': '',
                'needs_human_support': False,
                'support_message': '',
                'current_mood': ''
            }), 200
        return jsonify(state.to_dict()), 200
    except Exception as e:
        print(f"[Growing Tree State Error] {e}")
        # Return a synthetic success so the UI doesn't get stuck
        return jsonify({
            'tree_growth': 0,
            'tasks': [],
            'completed_tasks': [],
            'remaining_tasks': [],
            'acknowledgment': '',
            'needs_human_support': False,
            'support_message': '',
            'current_mood': ''
        }), 200

@growing_tree_bp.route('/generate-tasks', methods=['POST'])
@jwt_required()
def generate_tasks():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    player_statement = data.get('player_statement', '').strip()
    is_new_thread = data.get('is_new_thread', False)

    if not player_statement:
        return jsonify({'msg': 'Statement is required.'}), 400

    try:
        # Fetch existing state first to read previous tasks context and mood history
        state = GrowingTreeState.objects(user_id=user_id).first()
        previous_task_context = ""
        mood_history = []
        
        # If not starting a new thread, retrieve history & previous tasks
        if state and not is_new_thread:
            mood_history = getattr(state, 'mood_history', []) or []
            if state.tasks and len(state.tasks) > 0:
                last_task = state.tasks[-1]
                last_text = last_task.get("text", "")
                last_completed = last_task.get("completed", False)
                status_str = "completed it" if last_completed else "did not complete/struggled with it"
                previous_task_context = f"Their last task was '{last_text}', and they {status_str}."

        # Setup history context for this run
        if is_new_thread:
            temp_history = [player_statement]
        else:
            temp_history = list(mood_history) + [player_statement]

        # Initialize state model if not exists
        db_state = state if state else GrowingTreeState(user_id=user_id)

        def generate():
            full_text = ""
            try:
                # Stream chunk-by-chunk from Gemini
                for chunk in generate_task_list_stream(player_statement, previous_task_context, temp_history):
                    full_text += chunk
                    yield f"data: {chunk}\n\n"
            except Exception as stream_err:
                print(f"[Streaming error during call] {stream_err}")
                yield f"event: error\ndata: {json.dumps({'msg': str(stream_err)})}\n\n"
                return

            # After generator finishes successfully, parse full_text and save state
            try:
                result = json.loads(full_text)
                
                # Check for needs_human_support
                if result.get("needs_human_support"):
                    db_state.needs_human_support = True
                    db_state.support_message = result.get("message")
                    db_state.tasks = []
                    db_state.acknowledgment = ""
                else:
                    db_state.needs_human_support = False
                    db_state.support_message = ""
                    db_state.acknowledgment = result.get("acknowledgment", "Let's take things one step at a time.")
                    
                    formatted_tasks = []
                    for task in result.get("tasks", []):
                        formatted_tasks.append({
                            "id": str(task.get("id")) if task.get("id") else str(uuid.uuid4())[:8],
                            "text": task.get("text"),
                            "size": int(task.get("size", 1)),
                            "completed": False
                        })
                    db_state.tasks = formatted_tasks

                db_state.current_mood = player_statement
                db_state.mood_history = temp_history
                db_state.last_updated = datetime.utcnow()
                db_state.save()
            except Exception as e:
                # If JSON parsing failed at the end of the stream
                print(f"[Streaming state save error] {e}")

        return Response(generate(), mimetype='text/event-stream')

    except Exception as e:
        print(f"[Growing Tree Route Error] {e}")
        return jsonify({
            "msg": f"Failed to generate tasks due to an upstream API error: {str(e)}"
        }), 502

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

@growing_tree_bp.route('/reset', methods=['POST'])
@jwt_required()
def reset_tree():
    """Reset the tree back to seed — start fresh with a new concern."""
    user_id = get_jwt_identity()
    try:
        state = GrowingTreeState.objects(user_id=user_id).first()
        if state:
            state.tree_growth = 0
            state.tasks = []
            state.acknowledgment = ""
            state.current_mood = ""
            state.needs_human_support = False
            state.support_message = ""
            state.mood_history = []
            state.last_updated = datetime.utcnow()
            state.save()
        return jsonify({
            "tree_growth": 0,
            "tasks": [],
            "completed_tasks": [],
            "remaining_tasks": [],
            "acknowledgment": "",
            "needs_human_support": False,
            "support_message": "",
            "current_mood": ""
        }), 200
    except Exception as e:
        print(f"[Growing Tree Reset Error] {e}")
        return jsonify({
            "tree_growth": 0,
            "tasks": [],
            "completed_tasks": [],
            "remaining_tasks": [],
            "acknowledgment": "",
            "needs_human_support": False,
            "support_message": "",
            "current_mood": ""
        }), 200

@growing_tree_bp.route('/transcribe', methods=['POST'])
@jwt_required()
def transcribe_audio_route():
    import os
    audio_file = request.files.get("audio")
    if not audio_file:
        return jsonify({"error": "No audio provided"}), 400

    # Ensure a local temp directory exists in workspace
    temp_dir = os.path.join(os.getcwd(), 'temp')
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"temp_{uuid.uuid4().hex}.wav")
    audio_file.save(temp_path)

    try:
        from app.services.whisper_service import transcribe_audio
        text = transcribe_audio(temp_path)
        return jsonify({"text": text.strip()})
    except Exception as e:
        print(f"[STT Route Error] {e}")
        return jsonify({"error": f"Transcription failed: {str(e)}"}), 500
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

