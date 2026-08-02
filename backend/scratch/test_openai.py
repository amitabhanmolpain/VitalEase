import os
import requests

api_key = os.environ.get("OPENAI_API_KEY")
print("API KEY:", api_key[:15] if api_key else "None")

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

data = {
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "hello"}],
    "max_tokens": 10
}

r = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=data)
print("STATUS:", r.status_code)
print("RESPONSE:", r.text)
