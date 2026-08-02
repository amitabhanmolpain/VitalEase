import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")
print("KEY:", api_key)

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}"
headers = {"Content-Type": "application/json"}
data = {
    "contents": [{"parts": [{"text": "hello"}]}]
}

r = requests.post(url, headers=headers, json=data)
print("STATUS:", r.status_code)
print("RESPONSE:", r.text)
