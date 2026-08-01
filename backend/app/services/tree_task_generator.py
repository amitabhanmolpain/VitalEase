import os
import json
import uuid
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

# Define schema for valid task list generation
class TaskItem(BaseModel):
    id: str = Field(description="Unique short string ID for the task.")
    text: str = Field(description="A short, warm, non-guilt actionable task doable in real life.")
    size: int = Field(description="The size/effort level of the task from 1 (tiny) to 3 (slightly more effort).")

class TaskListGeneration(BaseModel):
    tasks: list[TaskItem] = Field(description="A list of 3 to 5 tasks ordered from easiest/gentlest to slightly bigger.")
    acknowledgment: str = Field(description="One short warm sentence acknowledging the user's feelings and situation.")

def generate_task_list(player_statement: str) -> dict:
    """
    Evaluates player statement for safety first.
    If self-harm/suicidal/abuse triggers are hit, returns crisis response.
    Otherwise, uses Gemini client to generate a list of 3-5 personalized tasks.
    """
    player_statement_lower = player_statement.lower()
    
    # 1. SAFETY CHECK
    crisis_keywords = ["suicide", "suicidal", "kill myself", "end my life", "self-harm", "self harm", "abuse", "abusing", "cut myself", "want to die"]
    if any(kw in player_statement_lower for kw in crisis_keywords):
        return {
            "needs_human_support": True,
            "message": "It sounds like you're carrying a lot of weight right now. Please know you're not alone, and there are people who want to listen. Consider reaching out to a friend, or connecting with a crisis line like 988 anytime. You deserve support."
        }

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return get_fallback_tasks(player_statement)

    try:
        client = genai.Client(api_key=api_key)

        prompt = f"""
You are a warm, gentle, and non-clinical assistant generating supportive real-world tasks for someone going through a tough time.
The user shared: "{player_statement}"

Task requirements:
1. Safety First: If the statement indicates self-harm, suicide, or abuse, return human support instructions. (Our local code checks this, but you must too).
2. Generate 3 to 5 realistic, small tasks ordered from easiest/gentlest (level 1) to slightly more effortful (level 3).
3. Personalize: Tasks must match the statement. E.g. grief inputs should get extremely gentle initial tasks like "drink a glass of water" or "sit somewhere comfortable for a few minutes". General low-motivation can start slightly more active.
4. Language: Keep it simple, warm, short. No clinical wording, no toxic positivity, and no guilt.
5. Provide a warm, short acknowledgment sentence first.
"""

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=TaskListGeneration,
                temperature=0.7,
            )
        )
        data = json.loads(response.text)
        
        # Ensure IDs are unique/clean
        for task in data.get('tasks', []):
            if not task.get('id'):
                task['id'] = str(uuid.uuid4())[:8]
        return data

    except Exception as e:
        print(f"[GrowingTree Gemini Error] {e}")
        return get_fallback_tasks(player_statement)

def get_fallback_tasks(player_statement: str) -> dict:
    """Generates simple fallback tasks if the Gemini API call fails."""
    player_statement_lower = player_statement.lower()
    
    # Simple check for grief
    if any(kw in player_statement_lower for kw in ["die", "died", "grief", "sad", "depressed", "lose", "lost"]):
        return {
            "tasks": [
                {"id": "t1", "text": "Drink a glass of water slowly.", "size": 1},
                {"id": "t2", "text": "Sit in a comfortable spot and close your eyes for two minutes.", "size": 1},
                {"id": "t3", "text": "Step outside or open a window to look at the sky.", "size": 2}
            ],
            "acknowledgment": "I'm so sorry you are going through this heavy loss. Let's take today one very small step at a time."
        }
    else:
        return {
            "tasks": [
                {"id": "t1", "text": "Stretch your arms and take three deep breaths.", "size": 1},
                {"id": "t2", "text": "Wash your face with cool water.", "size": 1},
                {"id": "t3", "text": "Walk around your room for a minute.", "size": 2}
            ],
            "acknowledgment": "I hear you. On days when energy is low, starting small is the best thing we can do."
        }
