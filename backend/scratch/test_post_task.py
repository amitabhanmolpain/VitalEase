import requests

# 1. Login to get JWT Token
login_url = "http://localhost:5000/api/auth/login"
login_payload = {
    "email": "test@test.com",
    "password": "Password123"
}

# If the test user doesn't exist, we can register first
register_url = "http://localhost:5000/api/auth/register"
register_payload = {
    "name": "Test User",
    "email": "test@test.com",
    "password": "Password123"
}

print("Attempting registration...")
reg_resp = requests.post(register_url, json=register_payload)
print("Registration response:", reg_resp.status_code, reg_resp.text)

print("Attempting login...")
login_resp = requests.post(login_url, json=login_payload)
print("Login response:", login_resp.status_code, login_resp.text)

if login_resp.status_code == 200:
    token = login_resp.json().get("access_token")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # 2. Test generate-tasks POST endpoint
    generate_url = "http://localhost:5000/api/growing-tree/generate-tasks"
    payload = {
        "player_statement": "I feel lost and lonely today."
    }
    
    print("\nTesting generate-tasks POST...")
    gen_resp = requests.post(generate_url, json=payload, headers=headers)
    print("Response Status Code:", gen_resp.status_code)
    print("Response JSON:", gen_resp.text)
else:
    print("Login failed, cannot test generate-tasks.")
