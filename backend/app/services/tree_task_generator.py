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

def call_groq_api(prompt: str, json_schema: bool = True) -> str:
    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        raise ValueError("GROQ_API_KEY not configured in environment")

    import urllib.request
    url = "https://api.groq.com/openai/v1/chat/completions"
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.75
    }
    if json_schema:
        payload["response_format"] = {"type": "json_object"}

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={
        "Authorization": f"Bearer {groq_key}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    })

    with urllib.request.urlopen(req, timeout=15) as response:
        res_json = json.loads(response.read().decode("utf-8"))
        return res_json["choices"][0]["message"]["content"]

def generate_task_list(player_statement: str, previous_task_context: str = "", mood_history: list = None) -> dict:
    """
    Evaluates player statement for safety first.
    If self-harm/suicidal/abuse triggers are hit, returns crisis response.
    Otherwise, uses Groq API (llama-3.3-70b-versatile) to generate personalized tasks.
    """
    player_statement_lower = player_statement.lower()
    
    # 1. SAFETY CHECK
    crisis_keywords = ["suicide", "suicidal", "kill myself", "end my life", "self-harm", "self harm", "abuse", "abusing", "cut myself", "want to die"]
    if any(kw in player_statement_lower for kw in crisis_keywords):
        return {
            "needs_human_support": True,
            "message": "It sounds like you're carrying a lot of weight right now. Please know you're not alone, and there are people who want to listen. Consider reaching out to a friend, or connecting with a crisis line like 988 anytime. You deserve support."
        }

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
1. RELEVANCE: All tasks MUST be directly related to the user's situation and feelings. E.g., if their boss scolded them or work is stressful, generate tasks like "take 5 slow deep breaths", "drink a glass of water", "write down one thing you did well today", or "step away from your desk for 3 minutes".
2. PROGRESSIVE DIFFICULTY: Look at "Previous Task State". If they completed the last task, make the new tasks slightly bigger. If they struggled, make the tasks even smaller and gentler.
3. TASK VARIABILITY: Generate 3 to 5 realistic, small tasks ordered from easiest/gentlest (level 1) to slightly more effortful (level 3).
4. Language: Keep it simple, warm, and short. No clinical wording, no toxic positivity, and no guilt.
5. Provide a warm, short acknowledgment sentence first.

Respond strictly in valid JSON matching this exact structure:
{{
  "acknowledgment": "one short warm sentence acknowledging their feeling",
  "tasks": [
     {{"id": "t1", "text": "actionable task 1", "size": 1}},
     {{"id": "t2", "text": "actionable task 2", "size": 2}},
     {{"id": "t3", "text": "actionable task 3", "size": 2}}
  ]
}}
"""

    # Primary: Groq API
    groq_key = os.environ.get("GROQ_API_KEY")
    if groq_key:
        try:
            print("[Groq API] Generating Growing Tree tasks via GROQ_API_KEY...")
            raw_res = call_groq_api(prompt, json_schema=True)
            data = json.loads(raw_res)
            for task in data.get('tasks', []):
                if not task.get('id'):
                    task['id'] = str(uuid.uuid4())[:8]
            return data
        except Exception as groq_err:
            print(f"[Groq API Exception in Growing Tree] Error: {groq_err}")

    # Fallback to Gemini API
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        try:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=TaskListGeneration,
                    temperature=0.8,
                )
            )
            data = json.loads(response.text)
            for task in data.get('tasks', []):
                if not task.get('id'):
                    task['id'] = str(uuid.uuid4())[:8]
            return data
        except Exception as e:
            print(f"[Gemini API Exception in Growing Tree] Error: {e}")

    return get_fallback_tasks(player_statement)

def generate_task_list_stream(player_statement: str, previous_task_context: str = "", mood_history: list = None):
    """
    Yields JSON output from Groq/Gemini to stream tasks.
    """
    player_statement_lower = player_statement.lower()
    crisis_keywords = ["suicide", "suicidal", "kill myself", "end my life", "self-harm", "self harm", "abuse", "abusing", "cut myself", "want to die"]
    if any(kw in player_statement_lower for kw in crisis_keywords):
        yield json.dumps({
            "needs_human_support": True,
            "message": "It sounds like you're carrying a lot of weight right now. Please know you're not alone, and there are people who want to listen. Consider reaching out to a friend, or connecting with a crisis line like 988 anytime. You deserve support."
        })
        return

    # Primary: Groq API
    groq_key = os.environ.get("GROQ_API_KEY")
    if groq_key:
        try:
            print("[Groq API Stream] Generating Growing Tree tasks via GROQ_API_KEY...")
            context_lines = []
            if mood_history and len(mood_history) > 1:
                context_lines.append(f"Conversation Mood History (earliest to latest):")
                for idx, h in enumerate(mood_history[:-1]):
                    context_lines.append(f" - Statement {idx+1}: \"{h}\"")
            if previous_task_context:
                context_lines.append(f"Previous Task State: {previous_task_context}")
            context_str = ("\n" + "\n".join(context_lines)) if context_lines else ""

            prompt = f"""
You are a warm, gentle, and non-clinical AI assistant generating supportive micro-tasks for someone going through a difficult time.
The user shared their current mood: "{player_statement}"
{context_str}

CRITICAL RULES FOR GENERATION:
1. RELEVANCE: Tailor tasks to the user's situation (e.g. boss scolding, burnout, sadness).
2. TASK STRUCTURE: Generate 3 to 5 small tasks (size 1 to 3).
3. Provide a warm, short acknowledgment sentence.

Respond strictly in valid JSON matching this structure:
{{
  "acknowledgment": "short warm sentence acknowledging their feeling",
  "tasks": [
     {{"id": "t1", "text": "task 1", "size": 1}},
     {{"id": "t2", "text": "task 2", "size": 2}},
     {{"id": "t3", "text": "task 3", "size": 2}}
  ]
}}
"""
            raw_res = call_groq_api(prompt, json_schema=True)
            yield raw_res
            return
        except Exception as groq_err:
            print(f"[Groq Stream Exception] Error: {groq_err}")

    # Fallback to Gemini API stream
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        try:
            client = genai.Client(api_key=api_key)
            response_stream = client.models.generate_content_stream(
                model='gemini-2.0-flash',
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
            return
        except Exception as gemini_err:
            print(f"[Gemini Stream Exception] Error: {gemini_err}")

    # Final fallback if APIs fail
    yield json.dumps({
        "acknowledgment": f"I hear that you're going through a tough moment with '{player_statement}'. Let me give you a few gentle steps.",
        "tasks": [
            {"id": "t1", "text": "Take three deep breaths and pause for a moment", "size": 1},
            {"id": "t2", "text": "Drink a small glass of cool water", "size": 1},
            {"id": "t3", "text": "Write down one thing you can do to take care of yourself today", "size": 2}
        ]
    })

