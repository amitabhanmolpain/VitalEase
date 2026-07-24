import requests
import json

BASE_URL = "http://127.0.0.1:5000/api/reframe-game"

def test_distortion_types():
    print("\n--- Testing GET /distortion-types ---")
    response = requests.get(f"{BASE_URL}/distortion-types")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_judge_reframe_validation_missing():
    print("\n--- Testing POST /judge-reframe (Missing Fields) ---")
    payload = {}
    response = requests.post(f"{BASE_URL}/judge-reframe", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_judge_reframe_validation_invalid_type():
    print("\n--- Testing POST /judge-reframe (Invalid Distortion Type) ---")
    payload = {
        "distortion_type": "invalid_type",
        "monster_statement": "I'm going to fail this presentation.",
        "player_reframe": "I will do my best and prepare well."
    }
    response = requests.post(f"{BASE_URL}/judge-reframe", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_judge_reframe_real_evaluation():
    print("\n--- Testing POST /judge-reframe (Real Evaluation / Expected 502 if API Key not set) ---")
    payload = {
        "distortion_type": "catastrophizing",
        "monster_statement": "If I mess up this presentation, my career is completely ruined and I will never get another job.",
        "player_reframe": "Even if I make a mistake, it is just one presentation. I will learn from it, and it won't ruin my whole career."
    }
    response = requests.post(f"{BASE_URL}/judge-reframe", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

if __name__ == "__main__":
    test_distortion_types()
    test_judge_reframe_validation_missing()
    test_judge_reframe_validation_invalid_type()
    test_judge_reframe_real_evaluation()
