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
        "Content-Type": "application/json"
    })

    with urllib.request.urlopen(req, timeout=10) as response:
        res_json = json.loads(response.read().decode("utf-8"))
        return res_json["choices"][0]["message"]["content"]

def evaluate_reframe(distortion_type: str, monster_statement: str, player_reframe: str) -> dict:
    """
    Evaluates the player's reframe of a cognitive distortion.
    Tries Gemini API first. If Gemini fails or quota is exhausted, falls back to Groq API using GROQ_API_KEY.
    """
    prompt = f"""
You are an expert cognitive behavioral therapist (CBT) judging a player's response in a thought reframing game.
The player is fighting a "Thought Monster" that has spoken a cognitive distortion.
The player must reply with a reframe that directly addresses and dismantles that specific cognitive distortion.

Cognitive Distortion being addressed:
- Type: {distortion_type}
- Monster Statement: "{monster_statement}"
- Player Reframe: "{player_reframe}"

Respond strictly in valid JSON with this exact structure:
{{
  "addresses_distortion": true or false,
  "quality_score": number between 0 and 100,
  "feedback": "one short, encouraging, and specific sentence",
  "monster_response": "one short in-character reaction line from the thought monster"
}}
"""
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        try:
            client = genai.Client(api_key=api_key)
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
            print(f"[Gemini API Failure] Trying GROQ_API_KEY fallback... Error: {e}")

    # Fallback to Groq API
    groq_key = os.environ.get("GROQ_API_KEY")
    if groq_key:
        try:
            print("[Groq API] Calling Groq API via GROQ_API_KEY...")
            raw_res = call_groq_api(prompt, json_schema=True)
            return json.loads(raw_res)
        except Exception as groq_err:
            print(f"[Groq API Exception] Error: {groq_err}")

    return get_fallback_evaluation(player_reframe)

def generate_receptionist_response(player_statement: str) -> str:
    """
    Generates a warm, in-character response from Mira the receptionist using Gemini or Groq API.
    """
    prompt = f"""
You are Mira, the warm and welcoming receptionist of the Reframe Castle.
The player is a seeker exploring the castle or dealing with difficult emotions.
They have just typed: "{player_statement}"

Respond to them in character as Mira:
- Keep the response short (1-2 sentences), warm, and supportive.
- Do not be clinical, diagnostic, or preachy.
- Direct them gently to explore the lobby, meet the monk in the temple, or enter one of the reflection suites on the left to begin reframing their thoughts.
"""
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        try:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
            )
            return response.text.strip()
        except Exception as e:
            print(f"[Gemini API Failure in Mira Response] Trying GROQ_API_KEY... Error: {e}")

    # Fallback to Groq API
    groq_key = os.environ.get("GROQ_API_KEY")
    if groq_key:
        try:
            print("[Groq API] Generating Mira response via GROQ_API_KEY...")
            return call_groq_api(prompt).strip()
        except Exception as groq_err:
            print(f"[Groq API Exception in Mira Response] Error: {groq_err}")

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
    Generates a dynamic, level-appropriate CBT battle scenario using Gemini API, falling back to Groq API if Gemini fails.
    """
    import random
    if level <= 2:
        difficulty = "easy"
        allowed_monsters = ["self-doubt-slime", "anxiety-ghost"]
    elif level <= 4:
        difficulty = "medium"
        allowed_monsters = ["anxiety-ghost", "hopelessness-troll"]
    else:
        difficulty = "hard"
        allowed_monsters = ["hopelessness-troll", "doomsday-dragon"]

    chosen_monster = random.choice(allowed_monsters)
    topics = [
        "academic failure", "social rejection", "public speaking anxiety", 
        "job/interview stress", "loneliness", "imposter syndrome", 
        "relationship conflict", "health worry", "time management pressure",
        "making a mistake in front of peers", "financial insecurity"
    ]
    chosen_topic = random.choice(topics)

    prompt = f"""
You are an expert cognitive behavioral therapist (CBT) designing a Level {level} scenario for a thought reframing game.
The player must defeat a "Thought Monster" representing a cognitive distortion.

Generate a scenario with specifications:
- Difficulty: {difficulty}
- Selected Monster: {chosen_monster}
- Chosen Focus Topic: {chosen_topic}

Respond strictly in valid JSON matching this exact structure:
{{
  "situation": "short, relatable situation specifically about {chosen_topic}",
  "negativeThought": "a negative distorted thought matching {chosen_monster}",
  "options": [
     {{"text": "constructive reframe", "isCorrect": true, "feedback": "encouraging feedback"}},
     {{"text": "distortion choice 1", "isCorrect": false, "feedback": "corrective feedback"}},
     {{"text": "distortion choice 2", "isCorrect": false, "feedback": "corrective feedback"}},
     {{"text": "distortion choice 3", "isCorrect": false, "feedback": "corrective feedback"}}
  ],
  "enemy": "{chosen_monster}",
  "difficulty": "{difficulty}"
}}
"""

    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        try:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=BattleScenario,
                    temperature=0.9,
                )
            )
            res_data = json.loads(response.text)
            res_data["isFallback"] = False
            return res_data
        except Exception as e:
            print(f"[Gemini Scenario Exception] Trying GROQ_API_KEY fallback... Error: {e}")

    # Fallback to Groq API
    groq_key = os.environ.get("GROQ_API_KEY")
    if groq_key:
        try:
            print("[Groq API] Generating battle scenario via GROQ_API_KEY...")
            raw_res = call_groq_api(prompt, json_schema=True)
            res_data = json.loads(raw_res)
            res_data["isFallback"] = False
            return res_data
        except Exception as groq_err:
            print(f"[Groq Scenario Exception] Error: {groq_err}")

    # Local fallback
    sc = get_fallback_scenario(level)
    sc["isFallback"] = True
    sc["aiNotice"] = "AI APIs offline or quota exceeded. Playing offline scenario."
    return sc

def get_fallback_scenario(level: int) -> dict:
    import random
    
    level_1_scenarios = [
        {
            "situation": "My friend didn't reply to my message immediately.",
            "negativeThought": "They must hate me.",
            "options": [
                {"text": "Maybe they are just busy right now.", "isCorrect": True, "feedback": "Excellent! Lack of immediate reply doesn't mean rejection."},
                {"text": "No one likes me.", "isCorrect": False, "feedback": "This is overgeneralization based on one event."},
                {"text": "I should never text anyone.", "isCorrect": False, "feedback": "This promotes isolation and avoidance."},
                {"text": "I always annoy people.", "isCorrect": False, "feedback": "This is negative labeling without evidence."}
            ],
            "enemy": "self-doubt-slime",
            "difficulty": "easy"
        },
        {
            "situation": "I didn't score as high as I wanted on a recent test.",
            "negativeThought": "I am a complete failure and not smart enough.",
            "options": [
                {"text": "One test score doesn't measure my intelligence; I can study differently next time.", "isCorrect": True, "feedback": "Great reframe! A single score is feedback, not your total worth."},
                {"text": "I should just give up on this subject.", "isCorrect": False, "feedback": "This is defeatist thinking that stops you from improving."},
                {"text": "I'm worse than everyone else.", "isCorrect": False, "feedback": "This is harsh self-comparison."},
                {"text": "I will fail every exam in the future.", "isCorrect": False, "feedback": "This is catastrophizing and fortune-telling."}
            ],
            "enemy": "self-doubt-slime",
            "difficulty": "easy"
        },
        {
            "situation": "I stumbled over my words while introducing myself in a meeting.",
            "negativeThought": "Everyone thinks I am completely incompetent.",
            "options": [
                {"text": "Nervous stumbles happen to everyone, people quickly move on.", "isCorrect": True, "feedback": "Spot on! People are far more understanding and forgiving than we think."},
                {"text": "I ruined my entire reputation.", "isCorrect": False, "feedback": "This is blowing a minor glitch out of proportion."},
                {"text": "I can never speak in public again.", "isCorrect": False, "feedback": "This promotes avoidance and fear."},
                {"text": "Everyone was secretly laughing at me.", "isCorrect": False, "feedback": "This is mind-reading without evidence."}
            ],
            "enemy": "anxiety-ghost",
            "difficulty": "easy"
        },
        {
            "situation": "I spilled coffee on my table during work.",
            "negativeThought": "I ruin everything I touch.",
            "options": [
                {"text": "Accidents happen to everyone; I can clean it up and keep going.", "isCorrect": True, "feedback": "Perfect! Spilling coffee is just an accident, not a character flaw."},
                {"text": "I am the messiest person alive.", "isCorrect": False, "feedback": "This is negative labeling over a minor spill."},
                {"text": "My whole day is ruined.", "isCorrect": False, "feedback": "This is catastrophizing a small issue."},
                {"text": "I shouldn't even try working today.", "isCorrect": False, "feedback": "This is defeatist thinking."}
            ],
            "enemy": "self-doubt-slime",
            "difficulty": "easy"
        },
        {
            "situation": "I arrived 5 minutes late to a casual meetup.",
            "negativeThought": "My friends will be furious and think I don't respect them.",
            "options": [
                {"text": "5 minutes is a small delay, I'll apologize politely and enjoy the meetup.", "isCorrect": True, "feedback": "Great reframe! A minor delay won't ruin a good friendship."},
                {"text": "They won't want me there anymore.", "isCorrect": False, "feedback": "This is fortune-telling without proof."},
                {"text": "I am completely unreliable.", "isCorrect": False, "feedback": "This is harsh all-or-nothing self-labeling."},
                {"text": "I should turn around and go home.", "isCorrect": False, "feedback": "This is avoidance behavior."}
            ],
            "enemy": "anxiety-ghost",
            "difficulty": "easy"
        }
    ]

    level_2_scenarios = [
        {
            "situation": "I got critical feedback from my supervisor on my draft.",
            "negativeThought": "I'm terrible at my job and will get fired.",
            "options": [
                {"text": "Feedback is an opportunity to learn and refine my work.", "isCorrect": True, "feedback": "Perfect! Constructive feedback is a tool for professional growth."},
                {"text": "I can't do anything right.", "isCorrect": False, "feedback": "This is all-or-nothing thinking based on one review."},
                {"text": "My supervisor personally dislikes me.", "isCorrect": False, "feedback": "This is mind-reading without objective evidence."},
                {"text": "I should start looking for another job immediately.", "isCorrect": False, "feedback": "This is catastrophizing the situation."}
            ],
            "enemy": "anxiety-ghost",
            "difficulty": "medium"
        },
        {
            "situation": "I wasn't invited to a weekend gathering with some colleagues.",
            "negativeThought": "They intentionally excluded me because nobody likes me.",
            "options": [
                {"text": "Group plans happen for many casual reasons; it doesn't mean I am excluded from the group.", "isCorrect": True, "feedback": "Awesome! Avoiding personalizing every event keeps perspective healthy."},
                {"text": "I will isolate myself from them from now on.", "isCorrect": False, "feedback": "This causes unnecessary distance and resentment."},
                {"text": "I am completely unlikable.", "isCorrect": False, "feedback": "This is negative labeling."},
                {"text": "They all talk bad about me behind my back.", "isCorrect": False, "feedback": "This is paranoid mind-reading."}
            ],
            "enemy": "self-doubt-slime",
            "difficulty": "medium"
        },
        {
            "situation": "I felt nervous while giving an answer in class/team meeting.",
            "negativeThought": "My voice sounded shaky so everyone thinks I don't know anything.",
            "options": [
                {"text": "Feeling nervous is natural; the substance of my answer is what matters.", "isCorrect": True, "feedback": "Excellent! Shaky vocal tone does not diminish your knowledge."},
                {"text": "I sounded like a complete fool.", "isCorrect": False, "feedback": "This is extreme self-judgment."},
                {"text": "I will never speak up again.", "isCorrect": False, "feedback": "This is fear-driven avoidance."},
                {"text": "Everyone noticed and was judging me.", "isCorrect": False, "feedback": "This is spotlight-effect mind reading."}
            ],
            "enemy": "anxiety-ghost",
            "difficulty": "medium"
        },
        {
            "situation": "My team project deadline is approaching fast.",
            "negativeThought": "We will never finish in time and it will all be my fault.",
            "options": [
                {"text": "We can break the remaining work into clear tasks and communicate.", "isCorrect": True, "feedback": "Awesome! Focusing on actionable steps reduces overwhelm."},
                {"text": "Everything is doomed.", "isCorrect": False, "feedback": "This is catastrophizing before the outcome."},
                {"text": "I should take on all the work myself.", "isCorrect": False, "feedback": "This leads to burnout and ignores teamwork."},
                {"text": "I am ruining the project for everyone.", "isCorrect": False, "feedback": "This is unnecessary personalization."}
            ],
            "enemy": "hopelessness-troll",
            "difficulty": "medium"
        }
    ]

    level_hard_scenarios = [
        {
            "situation": "A long-term project I worked hard on didn't succeed.",
            "negativeThought": "I'm completely incompetent and will never achieve anything.",
            "options": [
                {"text": "This project failed, but I gained valuable experience and skills for the next attempt.", "isCorrect": True, "feedback": "Outstanding! Separating your self-worth from a single outcome is key to resilience."},
                {"text": "I'm a failure.", "isCorrect": False, "feedback": "This is personalizing a complex project failure."},
                {"text": "Everything I do is a waste of time.", "isCorrect": False, "feedback": "This is overgeneralizing from one failure."},
                {"text": "I should give up my career goals.", "isCorrect": False, "feedback": "This is catastrophizing and fortune-telling."}
            ],
            "enemy": "doomsday-dragon",
            "difficulty": "hard"
        },
        {
            "situation": "I've been feeling overwhelmed and emotionally exhausted for a few days.",
            "negativeThought": "I will never feel normal again.",
            "options": [
                {"text": "Exhaustion passes when I take time to rest and care for myself.", "isCorrect": True, "feedback": "Compassionate reframe! Emotions and fatigue are temporary states."},
                {"text": "I am broken beyond repair.", "isCorrect": False, "feedback": "This is permanent negative labeling."},
                {"text": "There is no point in trying to rest.", "isCorrect": False, "feedback": "This is hopeless thinking."},
                {"text": "I am too weak for real life.", "isCorrect": False, "feedback": "This is self-critical judgment."}
            ],
            "enemy": "hopelessness-troll",
            "difficulty": "hard"
        },
        {
            "situation": "I made a poor financial decision that lost me money.",
            "negativeThought": "My life is ruined and I am completely irresponsible.",
            "options": [
                {"text": "It was a costly mistake, but I can make a plan to recover and make wiser choices.", "isCorrect": True, "feedback": "Empowering reframe! Mistakes can be rectified over time."},
                {"text": "I will end up broke forever.", "isCorrect": False, "feedback": "This is catastrophizing into the distant future."},
                {"text": "I am stupid for making that decision.", "isCorrect": False, "feedback": "This is self-degrading labeling."},
                {"text": "There is no way to recover from this.", "isCorrect": False, "feedback": "This is learned helplessness."}
            ],
            "enemy": "doomsday-dragon",
            "difficulty": "hard"
        }
    ]

    # Select pool by level
    if level <= 2:
        pool = level_1_scenarios
    elif level <= 4:
        pool = level_2_scenarios
    else:
        pool = level_hard_scenarios

    return random.choice(pool)
