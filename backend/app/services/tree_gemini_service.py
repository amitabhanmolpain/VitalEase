import os
import json
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

class TreeTaskResponse(BaseModel):
    task: str = Field(description="A single, short, actionable task sized perfectly to how the user feels (e.g. gentle if depressed, slightly bigger if active).")
    difficulty: int = Field(description="The difficulty scale of the task: 1 (very gentle / minimal effort), 2 (moderate), 3 (active / social).")
    reasoning: str = Field(description="A brief explanation of why this specific task fits today's mood/struggle.")

def generate_tree_task(mood_text: str, previous_difficulty: int, previous_status: str) -> dict:
    """
    Calls the Gemini API using google-genai to generate a single task suited to the user's current status and mood.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return get_fallback_task(mood_text, previous_difficulty, previous_status)

    try:
        client = genai.Client(api_key=api_key)

        prompt = f"""
You are a gentle and supportive mental health companion for a game called "The Growing Tree".
The user has shared their current state / mood: "{mood_text}"

Previous task status context:
- Previous difficulty level: {previous_difficulty} (1=gentle, 2=moderate, 3=active)
- Previous task outcome: "{previous_status}"

Your goal:
Provide exactly ONE, single, realistic task in real life that matches how heavy or light today feels for them.
- If the user is expressing grief, severe depression, or heavy struggles, give a very gentle level 1 task (e.g. "Drink one glass of water", "Sit by a window for 2 minutes", "Stretch your arms").
- If the user is feeling normal, okay, or lighter, provide a level 2 or 3 task (e.g. "Text one friend", "Tidy one surface", "Go for a 5-minute walk").
- Adjust based on previous outcome: If they managed the previous task, you can nudge the level up slightly or keep it steady. If they struggled (skipped or couldn't do it), keep it gentle (level 1), with absolutely no guilt.

Return your response in the specified JSON schema.
"""

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=TreeTaskResponse,
                temperature=0.7,
            )
        )
        return json.loads(response.text)

    except Exception as e:
        print(f"[Gemini Growing Tree Exception] Falling back to default generator. Error: {e}")
        return get_fallback_task(mood_text, previous_difficulty, previous_status)

def get_fallback_task(mood_text: str, previous_difficulty: int, previous_status: str) -> dict:
    """Generates a fallback task if the Gemini API call fails."""
    mood_lower = mood_text.lower()
    if any(w in mood_lower for w in ["sad", "depressed", "grief", "die", "died", "heavy", "hurt", "cry", "off"]):
        return {
            "task": "Drink a glass of water and sit quietly for 2 minutes.",
            "difficulty": 1,
            "reasoning": "Fallback: Heavy days deserve the gentlest beginnings."
        }
    else:
        return {
            "task": "Take a deep breath and stretch your body for 1 minute.",
            "difficulty": 1,
            "reasoning": "Fallback: A simple stretch to bring presence to your day."
        }
