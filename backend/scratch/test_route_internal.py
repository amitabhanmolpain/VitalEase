import os
import sys
import json

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.models.growing_tree_model import GrowingTreeState
from flask_jwt_extended import create_access_token

app = create_app()
app.config['TESTING'] = True

with app.app_context():
    # Create a test token
    test_user_id = "test_user_123"
    token = create_access_token(identity=test_user_id)
    
    client = app.test_client()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "player_statement": "My dog died, I'm depressed."
    }
    
    print("Sending POST to /api/growing-tree/generate-tasks...")
    response = client.post("/api/growing-tree/generate-tasks", 
                           data=json.dumps(payload), 
                           headers=headers)
    print("Status Code:", response.status_code)
    print("Response Data:", response.data.decode('utf-8'))
