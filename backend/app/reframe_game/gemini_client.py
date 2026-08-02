import os
import json
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

class ReframeEvaluation(BaseModel):
    addresses_distortion: bool = Field(
        description="True if the player's reframe genuinely addresses the specific cognitive distortion, False otherwise."
    )
    quality_score: int = Field(
        description="Score between 0 and 100 representing how well the reframe counters the cognitive distortion based on real CBT principles (not generic positivity)."
    )
    feedback: str = Field(
        description="One short, encouraging, and specific feedback sentence explaining the evaluation or how to improve it."
    )
    monster_response: str = Field(
        description="One short, in-character reaction line from the thought monster expressing its resistance or acceptance of the reframe."
    )

def evaluate_reframe(distortion_type: str, monster_statement: str, player_reframe: str) -> dict:
    """
    Calls the Gemini API using google-genai to evaluate the player's reframe of a cognitive distortion.
    If the API call fails or the API key is invalid/missing, fails gracefully with a fallback response.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return get_fallback_evaluation(player_reframe)

    try:
        client = genai.Client(api_key=api_key)

        prompt = f"""
You are an expert cognitive behavioral therapist (CBT) judging a player's response in a thought reframing game.
The player is fighting a "Thought Monster" that has spoken a cognitive distortion.
The player must reply with a reframe that directly addresses and dismantles that specific cognitive distortion.

Cognitive Distortion being addressed:
- Type: {distortion_type}
- Monster Statement: "{monster_statement}"
- Player Reframe: "{player_reframe}"

Your task:
1. Determine if the player's reframe genuinely addresses the specific cognitive distortion '{distortion_type}'.
   Note: It must address this specific distortion, not just be generic positivity or empty motivation (e.g. "I'm awesome", "things will be fine" should score low, whereas reframing the thoughts with evidence or realistic perspectives should score high).
2. Assign a quality score between 0 and 100.
3. Provide one short, encouraging, and specific feedback sentence.
4. Provide one short, in-character reaction line from the Thought Monster (e.g., expressing frustration at being dismantled, or showing a crack in its armor, or retreating).

Ensure your response conforms strictly to the requested schema.
"""

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ReframeEvaluation,
                temperature=0.0,
            )
        )

        return json.loads(response.text)

    except Exception as e:
        print(f"[Gemini API Exception] Falling back to mock evaluation. Error: {e}")
        return get_fallback_evaluation(player_reframe)

def get_fallback_evaluation(player_reframe: str) -> dict:
    """Generates a fallback evaluation response when Gemini API is offline/invalid."""
    words = len(player_reframe.split())
    score = min(95, max(40, words * 6))
    
    return {
        "addresses_distortion": True,
        "quality_score": score,
        "feedback": "CBT Fallback: You are practicing valuable reframing skills by identifying realistic alternatives to negative thoughts.",
        "monster_response": "Your logical reasoning is making my grip fade..."
    }

def generate_receptionist_response(player_statement: str) -> str:
    """
    Generates a warm, in-character response from Mira the receptionist using Gemini API.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return "I understand. Take your time to look around, or step into one of the reflection rooms on the left to start reframing."

    try:
        client = genai.Client(api_key=api_key)

        prompt = f"""
You are Mira, the warm and welcoming receptionist of the Reframe Castle.
The player is a seeker exploring the castle or dealing with difficult emotions.
They have just typed: "{player_statement}"

Respond to them in character as Mira:
- Keep the response short (1-2 sentences), warm, and supportive.
- Do not be clinical, diagnostic, or preachy.
- Direct them gently to explore the lobby, meet the monk in the temple, or enter one of the reflection suites on the left to begin reframing their thoughts.
"""

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )

        return response.text.strip()

    except Exception as e:
        print(f"[Gemini API Exception in Mira Response] Error: {e}")
        return "I understand. Take your time to look around, or step into one of the reflection rooms on the left to start reframing."

class ScenarioOption(BaseModel):
    text: str = Field(description="The response option text.")
    isCorrect: bool = Field(description="True if this option is a constructive CBT cognitive reframe, False otherwise.")
    feedback: str = Field(description="Helpful, specific feedback explaining why this is or isn't a good reframe.")

class BattleScenario(BaseModel):
    situation: str = Field(description="A realistic, relatable negative situation.")
    negativeThought: str = Field(description="The negative, distorted thought associated with the situation.")
    options: list[ScenarioOption] = Field(description="A list of exactly 4 options (1 correct, 3 incorrect).")
    enemy: str = Field(description="The thought monster name. Must be one of: 'self-doubt-slime', 'anxiety-ghost', 'hopelessness-troll', 'doomsday-dragon'.")
    difficulty: str = Field(description="The difficulty level. Must be one of: 'easy', 'medium', 'hard'.")

def generate_battle_scenario(level: int) -> dict:
    """
    Generates a dynamic, level-appropriate CBT battle scenario using Gemini.
    Difficulty level increases with player level:
    - Level 1-2: Easy (Self-Doubt Slime or Anxiety Ghost)
    - Level 3-4: Medium (Anxiety Ghost or Hopelessness Troll)
    - Level 5+: Hard (Hopelessness Troll or Doomsday Dragon)
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return get_fallback_scenario(level)

    try:
        # Determine difficulty and allowed monsters based on level
        if level <= 2:
            difficulty = "easy"
            allowed_monsters = ["self-doubt-slime", "anxiety-ghost"]
        elif level <= 4:
            difficulty = "medium"
            allowed_monsters = ["anxiety-ghost", "hopelessness-troll"]
        else:
            difficulty = "hard"
            allowed_monsters = ["hopelessness-troll", "doomsday-dragon"]

        client = genai.Client(api_key=api_key)

        prompt = f"""
You are an expert cognitive behavioral therapist (CBT) designing a Level {level} scenario for a thought reframing game.
The player must defeat a "Thought Monster" representing a cognitive distortion.

Generate a scenario with the following specifications:
- Difficulty: {difficulty}
- Allowed Monsters: {allowed_monsters} (Choose one from the list that fits the scenario theme)

The scenario MUST contain:
1. A realistic, short, relatable situation.
2. A negative thought expressing a cognitive distortion.
3. Exactly 4 options:
   - Exactly ONE option must be a constructive CBT cognitive reframe (marked as isCorrect: true, with encouraging feedback).
   - The other THREE options must be unconstructive/distortion-reinforcing choices (marked as isCorrect: false, with supportive corrective feedback explaining the cognitive distortion trap).

Ensure your response conforms strictly to the requested schema.
"""

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=BattleScenario,
                temperature=0.8,
            )
        )

        return json.loads(response.text)

    except Exception as e:
        print(f"[Gemini Scenario Exception] Falling back to static scenario. Error: {e}")
        return get_fallback_scenario(level)

def get_fallback_scenario(level: int) -> dict:
    if level <= 2:
        return {
            "situation": "My friend didn't reply to my message.",
            "negativeThought": "They must hate me.",
            "options": [
                {"text": "Maybe they are just busy.", "isCorrect": True, "feedback": "Excellent! Lack of reply doesn't automatically mean rejection."},
                {"text": "No one likes me.", "isCorrect": False, "feedback": "This is overgeneralization based on one event."},
                {"text": "I should never text anyone.", "isCorrect": False, "feedback": "This promotes isolation and avoidance."},
                {"text": "I always annoy people.", "isCorrect": False, "feedback": "This is negative labeling without evidence."}
            ],
            "enemy": "self-doubt-slime",
            "difficulty": "easy"
        }
    elif level <= 4:
        return {
            "situation": "I got critical feedback from my boss.",
            "negativeThought": "I'm going to get fired.",
            "options": [
                {"text": "Feedback helps me learn and improve.", "isCorrect": True, "feedback": "Perfect! Constructive feedback is a tool for growth."},
                {"text": "I can't do anything right.", "isCorrect": False, "feedback": "This is all-or-nothing thinking based on one review."},
                {"text": "My boss hates me.", "isCorrect": False, "feedback": "This is mind-reading without objective evidence."},
                {"text": "I should start looking for another job immediately.", "isCorrect": False, "feedback": "This is catastrophizing the situation."}
            ],
            "enemy": "anxiety-ghost",
            "difficulty": "medium"
        }
    else:
        return {
            "situation": "A long-term project I worked on failed.",
            "negativeThought": "I'm completely incompetent and will never achieve anything.",
            "options": [
                {"text": "This project failed, but I learned valuable lessons for the next one.", "isCorrect": True, "feedback": "Outstanding! Separating your self-worth from a single outcome is key to resilience."},
                {"text": "I'm a failure.", "isCorrect": False, "feedback": "This is personalizing a complex project failure."},
                {"text": "Everything I do is a waste of time.", "isCorrect": False, "feedback": "This is overgeneralizing from one failure."},
                {"text": "I should give up my career goals.", "isCorrect": False, "feedback": "This is catastrophizing and fortune-telling."}
            ],
            "enemy": "doomsday-dragon",
            "difficulty": "hard"
        }
