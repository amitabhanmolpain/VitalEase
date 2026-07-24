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
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured in the environment.")

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
