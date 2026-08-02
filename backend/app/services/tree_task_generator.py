import os
import json
import uuid
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

# Define schema for valid task list generation
class TaskItem(BaseModel):
    id: str = Field(description="Unique short string ID for the task.")
    text: str = Field(description="A short, warm, non-guilt actionable task doable in real life.")
    size: int = Field(description="The size/effort level of the task from 1 (tiny) to 3 (slightly more effort).")

class TaskListGeneration(BaseModel):
    tasks: list[TaskItem] = Field(description="A list of 3 to 5 tasks ordered from easiest/gentlest to slightly bigger.")
    acknowledgment: str = Field(description="One short warm sentence acknowledging the user's feelings and situation.")

def generate_task_list(player_statement: str, previous_task_context: str = "", mood_history: list = None) -> dict:
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

    client = genai.Client(api_key=api_key)

    # Context build
    context_lines = []
    if mood_history and len(mood_history) > 1:
        context_lines.append(f"Conversation Mood History (earliest to latest):")
        for idx, h in enumerate(mood_history[:-1]):
            context_lines.append(f" - Statement {idx+1}: \"{h}\"")
    
    if previous_task_context:
        context_lines.append(f"Previous Task State: {previous_task_context}")
        
    context_str = ""
    if context_lines:
        context_str = "\n" + "\n".join(context_lines)

    prompt = f"""
You are a warm, gentle, and non-clinical AI assistant generating supportive, real-world micro-tasks for someone going through a difficult time.
The user shared their current mood/feeling: "{player_statement}"
{context_str}

CRITICAL RULES FOR GENERATION:
1. RELEVANCE: All tasks MUST be directly related to the user's situation and feelings. E.g., if their dog died, do NOT generate generic tasks like "wash a dish" or "clean a window". Instead, generate tasks like "look at a photo of your dog", "light a candle for them", "pat their favorite spot", or "sit quietly with their memories".
2. PROGRESSIVE DIFFICULTY: Look at "Previous Task State". If they completed the last task, make the new tasks slightly bigger (step up the level/action slightly). If they struggled, make the tasks even smaller and gentler.
3. TASK VARIABILITY: Never repeat the previous tasks or return identical lists. Every time the user asks, generate fresh, creative ideas tailored to their exact state.
4. TASK STRUCTURE: Generate 3 to 5 realistic, small tasks ordered from easiest/gentlest (level 1) to slightly more effortful (level 3).
5. Language: Keep it simple, warm, and short. No clinical wording, no toxic positivity, and no guilt.
6. Provide a warm, short acknowledgment sentence first.
"""

    print("=================== GEMINI PROMPT ===================")
    print(prompt)
    print("=====================================================")

    response = client.models.generate_content(
        model='gemini-3.5-flash-lite',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=TaskListGeneration,
            temperature=0.8, # Slightly higher temperature for freshness
        )
    )
    print("=================== RAW GEMINI RESPONSE ===================")
    print(response.text)
    print("===========================================================")
    data = json.loads(response.text)
    
    # Ensure IDs are unique/clean
    for task in data.get('tasks', []):
        if not task.get('id'):
            task['id'] = str(uuid.uuid4())[:8]
    return data

def generate_task_list_stream(player_statement: str, previous_task_context: str = "", mood_history: list = None):
    """
    Yields chunks of the generated JSON output from Gemini as they arrive.
    Supports streaming to minimize latency.
    """
    player_statement_lower = player_statement.lower()
    crisis_keywords = ["suicide", "suicidal", "kill myself", "end my life", "self-harm", "self harm", "abuse", "abusing", "cut myself", "want to die"]
    if any(kw in player_statement_lower for kw in crisis_keywords):
        yield json.dumps({
            "needs_human_support": True,
            "message": "It sounds like you're carrying a lot of weight right now. Please know you're not alone, and there are people who want to listen. Consider reaching out to a friend, or connecting with a crisis line like 988 anytime. You deserve support."
        })
        return

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        yield json.dumps({
            "error": "GEMINI_API_KEY is not set."
        })
        return

    client = genai.Client(api_key=api_key)

    # Context build
    context_lines = []
    if mood_history and len(mood_history) > 1:
        context_lines.append(f"Conversation Mood History (earliest to latest):")
        for idx, h in enumerate(mood_history[:-1]):
            context_lines.append(f" - Statement {idx+1}: \"{h}\"")
    
    if previous_task_context:
        context_lines.append(f"Previous Task State: {previous_task_context}")
        
    context_str = ""
    if context_lines:
        context_str = "\n" + "\n".join(context_lines)

    prompt = f"""
You are a warm, gentle, and non-clinical AI assistant generating supportive, real-world micro-tasks for someone going through a difficult time.
The user shared their current mood/feeling: "{player_statement}"
{context_str}

CRITICAL RULES FOR GENERATION:
1. RELEVANCE: All tasks MUST be directly related to the user's situation and feelings. E.g., if their dog died, do NOT generate generic tasks like "wash a dish" or "clean a window". Instead, generate tasks like "look at a photo of your dog", "light a candle for them", "pat their favorite spot", or "sit quietly with their memories".
2. PROGRESSIVE DIFFICULTY: Look at "Previous Task State". If they completed the last task, make the new tasks slightly bigger (step up the level/action slightly). If they struggled, make the tasks even smaller and gentler.
3. TASK VARIABILITY: Never repeat the previous tasks or return identical lists. Every time the user asks, generate fresh, creative ideas tailored to their exact state.
4. TASK STRUCTURE: Generate 3 to 5 realistic, small tasks ordered from easiest/gentlest (level 1) to slightly more effortful (level 3).
5. Language: Keep it simple, warm, and short. No clinical wording, no toxic positivity, and no guilt.
6. Provide a warm, short acknowledgment sentence first.
"""

    response_stream = client.models.generate_content_stream(
        model='gemini-3.5-flash-lite',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=TaskListGeneration,
            temperature=0.8,
        )
    )
    for chunk in response_stream:
        if chunk.text:
            yield chunk.text

