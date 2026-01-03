import requests
import json
import os

api_key = os.get_env("OPENROUTER_API_KEY")

print("Testing different OpenRouter request formats...\n")

# Test with different content-type combinations
test_cases = [
    {
        "name": "With Content-Type header",
        "headers": {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    },
    {
        "name": "Without Content-Type",
        "headers": {
            "Authorization": f"Bearer {api_key}"
        }
    },
    {
        "name": "With HTTP-Referer",
        "headers": {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:8080"
        }
    }
]

url = "https://openrouter.io/api/v1/chat/completions"
payload = {
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 100
}

for test in test_cases:
    print(f"Trying: {test['name']}")
    try:
        response = requests.post(url, 
                               json=payload, 
                               headers=test['headers'], 
                               timeout=10)
        print(f"  Status: {response.status_code}")
        if response.status_code != 405:
            print(f"  Response: {response.text[:200]}")
        print()
    except Exception as e:
        print(f"  Error: {e}\n")

# Also try with data instead of json
print("Trying: With data parameter instead of json")
try:
    response = requests.post(url, 
                           data=json.dumps(payload),
                           headers={
                               "Authorization": f"Bearer {api_key}",
                               "Content-Type": "application/json"
                           }, 
                           timeout=10)
    print(f"  Status: {response.status_code}")
    print(f"  Response: {response.text[:300]}")
except Exception as e:
    print(f"  Error: {e}")
