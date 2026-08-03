import os
import json
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import Optional

class GroundedAffirmationResponse(BaseModel):
    needs_human_support: bool = Field(
        description="True if the player's statement indicates a crisis outside this game's scope, including self-harm, suicide, suicidal ideation, depression crisis, or abuse. False otherwise."
    )
    message: Optional[str] = Field(
        default=None,
        description="A short, warm, non-clinical message directing them to reach out to a real person, helpline, or crisis line. Required if needs_human_support is True."
    )
    acknowledgment: Optional[str] = Field(
        default=None,
        description="A short sentence acknowledging the specific difficulty named by the player in their own terms (not a general category)."
    )
    validation: Optional[str] = Field(
        default=None,
        description="A short sentence validating that the feeling is a reasonable, real response to that difficulty."
    )
    grounded_hope: Optional[str] = Field(
        default=None,
        description="A short sentence offering one specific, plausible reason for hope or strength tied directly to what they said."
    )
    full_response: Optional[str] = Field(
        default=None,
        description="All three parts (acknowledgment, validation, and grounded_hope) combined into one natural-sounding spoken line."
    )

def call_groq_api(prompt: str, json_schema: dict = None) -> str:
    """
    Calls the Groq Cloud API (llama-3.3-70b-versatile) using standard HTTP urllib.
    Falls back gracefully if GROQ_API_KEY is missing or invalid.
    """
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
        "temperature": 0.7
    }
    if json_schema:
        payload["response_format"] = {"type": "json_object"}

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={
        "Authorization": f"Bearer {groq_key}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    })

    with urllib.request.urlopen(req, timeout=10) as response:
        res_json = json.loads(response.read().decode("utf-8"))
        return res_json["choices"][0]["message"]["content"]

def generate_affirmation(player_statement: str) -> dict:
    """
    Evaluates player statement and produces grounded validation/comfort response using Groq API (llama-3.3-70b-versatile).
    Falls back to Gemini API or local rules if unavailable.
    """
    prompt = f"""
Evaluate the following statement from a player in a mental health support game.

Player Statement: "{player_statement}"

Your tasks:
1. First, check if the statement indicates a crisis beyond the game's scope, including self-harm, suicidal ideation, or abuse.
   - If yes, set 'needs_human_support' to True and provide a warm, non-clinical message in 'message' directing them to reach out to a real person, helpline, or crisis line (e.g., "I hear how much pain you're in, and I want you to be safe. Please consider reaching out to a trusted friend or a crisis helpline like 988 where real people are ready to support you.").
   - If yes, set acknowledgment, validation, grounded_hope, and full_response to null.
   - If no, set 'needs_human_support' to False.

2. If 'needs_human_support' is False, generate a grounded affirmation conforming to these strict guidelines:
   - Acknowledgment: Acknowledge the SPECIFIC difficulty the player described in their own terms (not a general category).
   - Validation: Validate that the feeling is a reasonable, real response (do not say "don't worry" or dismiss it).
   - Grounded Hope: Offer ONE grounded, plausible, specific reason for hope or strength that connects directly to something in what they said (e.g., effort already made, a past success, a concrete next step). NOT a guarantee of a good outcome, NOT a generic platitude.
   - Full Response: Combine the acknowledgment, validation, and grounded hope into one natural-sounding spoken line, ready to pass to Text-to-Speech.

   CRITICAL BAN LIST (Strictly avoid these patterns):
   - Do NOT use generic phrases like "everything happens for a reason", "you've got this", "stay positive", "everything will be okay", "you're amazing".
   - Do NOT write a response that could apply to any negative thought. The response must be clearly specific to what this player said.
   - Do NOT make false guarantees about outcomes ("it will definitely work out").
   - Do NOT use toxic positivity that dismisses the difficulty of the feeling.

Respond strictly in valid JSON matching this exact structure:
{{
  "needs_human_support": true or false,
  "message": "crisis message or null",
  "acknowledgment": "acknowledgment string or null",
  "validation": "validation string or null",
  "grounded_hope": "grounded hope string or null",
  "full_response": "full combined response string or null"
}}
"""
    # Primary: Try Groq API
    groq_key = os.environ.get("GROQ_API_KEY")
    if groq_key:
        try:
            print("[Groq API] Generating positive affirmation via GROQ_API_KEY...")
            raw_res = call_groq_api(prompt, json_schema=True)
            return json.loads(raw_res)
        except Exception as groq_err:
            print(f"[Groq API Exception in Affirmation Agent] Error: {groq_err}")

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
                    response_schema=GroundedAffirmationResponse,
                    temperature=0.8,
                )
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"[Gemini API Exception in Affirmation Agent] Error: {e}")

    return get_fallback_affirmation(player_statement)

def get_fallback_affirmation(player_statement: str) -> dict:
    """Generates a fallback safety or affirmation response when Gemini API is offline/invalid."""
    lower_statement = player_statement.lower()
    self_harm_keywords = ["suicide", "self-harm", "kill myself", "end my life", "harm myself", "die", "abuse", "hurt myself"]
    
    if any(kw in lower_statement for kw in self_harm_keywords):
        return {
            "needs_human_support": True,
            "message": "I'm concerned to hear that. Please know you are not alone, and there is support available. You can reach out to a crisis helpline like 988 or talk to a trusted professional."
        }

    ack = f"I hear that you are dealing with feeling concerned about {player_statement}."
    val = "It makes complete sense to feel overwhelmed when facing these kinds of thoughts."
    hope = "Taking a moment to pause and speak this out loud is a strong first step towards clarity."
    full = f"{ack} {val} {hope}"

    return {
        "needs_human_support": False,
        "acknowledgment": ack,
        "validation": val,
        "grounded_hope": hope,
        "full_response": full
    }
