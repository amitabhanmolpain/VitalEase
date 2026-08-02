import unittest
from unittest.mock import MagicMock, patch
import json
import re

# Setup path and environment
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.models.growing_tree_model import GrowingTreeState
from flask_jwt_extended import create_access_token

class GrowingTreeRegressionTest(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['JWT_SECRET_KEY'] = 'test_secret'
        self.client = self.app.test_client()
        
        # Clear database states
        with self.app.app_context():
            try:
                GrowingTreeState.objects.delete()
            except Exception:
                pass

    @patch('google.genai.Client')
    def test_dynamic_task_generation(self, mock_client_cls):
        # 1. Setup Mock Gemini responses for different inputs
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        
        def mock_generate_content(*args, **kwargs):
            contents_arg = kwargs.get('contents', '')
            if not contents_arg and len(args) > 1:
                contents_arg = args[1]
            if not isinstance(contents_arg, str):
                contents_arg = str(contents_arg)
                
            # Extract the actual current mood/feeling value
            mood_match = re.search(r'The user shared their current mood/feeling: "([^"]+)"', contents_arg)
            current_mood = mood_match.group(1).lower() if mood_match else contents_arg.lower()
            
            mock_response = MagicMock()
            if "dog" in current_mood:
                mock_response.text = json.dumps({
                    "acknowledgment": "I'm so sorry to hear about your dog.",
                    "tasks": [
                        {"id": "d1", "text": "Find a favorite photo of your dog.", "size": 1},
                        {"id": "d2", "text": "Light a candle or dedicate a quiet moment to their memory.", "size": 2}
                    ]
                })
            elif "lonely" in current_mood or "bored" in current_mood:
                mock_response.text = json.dumps({
                    "acknowledgment": "Feeling lonely or bored is tough.",
                    "tasks": [
                        {"id": "b1", "text": "Do a quick 5-minute stretch.", "size": 1},
                        {"id": "b2", "text": "Message one friend just to say hi.", "size": 2}
                    ]
                })
            else:
                mock_response.text = json.dumps({
                    "acknowledgment": "Let's take a small step.",
                    "tasks": [
                        {"id": "g1", "text": "Take a deep breath.", "size": 1}
                    ]
                })
            return mock_response
            
        mock_client.models.generate_content.side_effect = mock_generate_content

        with self.app.app_context():
            token = create_access_token(identity='test_user_id')
            headers = {'Authorization': f'Bearer {token}'}

            # Call 1: "my dog died"
            response1 = self.client.post(
                '/api/growing-tree/generate-tasks',
                json={'player_statement': 'my dog died'},
                headers=headers
            )
            self.assertEqual(response1.status_code, 200)
            data1 = response1.get_json()
            tasks1 = [t['text'] for t in data1['tasks']]

            # Call 2: "I'm bored and unmotivated"
            response2 = self.client.post(
                '/api/growing-tree/generate-tasks',
                json={'player_statement': 'I\'m bored and unmotivated'},
                headers=headers
            )
            self.assertEqual(response2.status_code, 200)
            data2 = response2.get_json()
            tasks2 = [t['text'] for t in data2['tasks']]

            # Assert task outputs are NOT identical
            print(f"Tasks for 'my dog died': {tasks1}")
            print(f"Tasks for 'I'm bored': {tasks2}")
            self.assertNotEqual(tasks1, tasks2, "Returned tasks should not be identical for different inputs!")
            
    @patch('google.genai.Client')
    def test_502_error_on_gemini_failure(self, mock_client_cls):
        # Setup mock client to throw an exception
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        mock_client.models.generate_content.side_effect = Exception("API Key reported as leaked / Perm Denied")
        
        with self.app.app_context():
            token = create_access_token(identity='test_user_id')
            headers = {'Authorization': f'Bearer {token}'}
            
            response = self.client.post(
                '/api/growing-tree/generate-tasks',
                json={'player_statement': 'my dog died'},
                headers=headers
            )
            # Must return 502 Bad Gateway
            self.assertEqual(response.status_code, 502)
            data = response.get_json()
            self.assertIn("Failed to generate tasks due to an upstream API error", data['msg'])

    @patch('google.genai.Client')
    def test_something_else_bothering_you_fresh_thread(self, mock_client_cls):
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client

        generated_prompts = []

        def mock_generate_content(*args, **kwargs):
            contents_arg = kwargs.get('contents', '')
            if not contents_arg and len(args) > 1:
                contents_arg = args[1]
            generated_prompts.append(str(contents_arg))

            mock_response = MagicMock()
            mock_response.text = json.dumps({
                "acknowledgment": "Focusing on something new.",
                "tasks": [
                    {"id": "tnew", "text": "Do a new task.", "size": 1}
                ]
            })
            return mock_response

        mock_client.models.generate_content.side_effect = mock_generate_content

        with self.app.app_context():
            token = create_access_token(identity='test_user_id')
            headers = {'Authorization': f'Bearer {token}'}

            # 1. Submit initial concern: "my dog died"
            self.client.post(
                '/api/growing-tree/generate-tasks',
                json={'player_statement': 'my dog died'},
                headers=headers
            )

            # 2. Complete a task to increase growth
            complete_res = self.client.post(
                '/api/growing-tree/complete-task',
                json={'task_id': 'tnew', 'task_size': 2},
                headers=headers
            )
            self.assertEqual(complete_res.status_code, 200)
            growth_before = complete_res.get_json()['tree_growth']
            self.assertGreater(growth_before, 0)

            # 3. Trigger "Something else bothering you?" button — calls generate-tasks with is_new_thread: True
            new_thread_res = self.client.post(
                '/api/growing-tree/generate-tasks',
                json={
                    'player_statement': 'stressed about work',
                    'is_new_thread': True
                },
                headers=headers
            )
            self.assertEqual(new_thread_res.status_code, 200)

            # 4. Assert:
            # - A: Tree growth value persists and does not reset to 0
            state = GrowingTreeState.objects(user_id='test_user_id').first()
            self.assertEqual(state.tree_growth, growth_before, "tree_growth must not reset on fresh thread")

            # - B: Prompt for "stressed about work" did not contain previous concern history (no "my dog died" context)
            last_prompt = generated_prompts[-1]
            self.assertIn("stressed about work", last_prompt)
            self.assertNotIn("my dog died", last_prompt, "Previous concern history must not be injected in a fresh thread")

if __name__ == '__main__':
    unittest.main()
