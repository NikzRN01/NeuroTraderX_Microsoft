import requests

api_key = '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'

# Test 1: Check if models endpoint is accessible (to verify authentication)
print('=== Test 1: Verify API Key Authentication ===')
models_response = requests.get(
    'https://openrouter.io/api/v1/models',
    headers={'Authorization': f'Bearer {api_key}'},
    timeout=10
)
print(f'Models Endpoint Status: {models_response.status_code}')
if models_response.status_code == 200:
    models = models_response.json()
    data = models.get('data', [])
    gemini_models = [m for m in data if 'gemini' in m.get('id', '').lower()]
    if gemini_models:
        print(f'Found {len(gemini_models)} Gemini models available')
        first_model_id = gemini_models[0].get('id', 'Unknown')
        print(f'First Gemini model: {first_model_id}')
    else:
        print('No Gemini models found in available models')
        print(f'Total models available: {len(data)}')
else:
    print(f'Error: {models_response.text[:200]}')

# Test 2: Try chat endpoint with different model
print('\n=== Test 2: Test chat endpoint with standard OpenAI model ===')
chat_response = requests.post(
    'https://openrouter.io/api/v1/chat/completions',
    headers={
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    },
    json={
        'model': 'openai/gpt-3.5-turbo',
        'messages': [{'role': 'user', 'content': 'Hello'}],
        'max_tokens': 10
    },
    timeout=10
)
print(f'Chat (GPT-3.5) Status: {chat_response.status_code}')
if chat_response.status_code != 200:
    print(f'Error: {chat_response.text[:300]}')
else:
    print('SUCCESS: GPT-3.5 model works!')

# Test 3: Try with Gemini model
print('\n=== Test 3: Test chat endpoint with Gemini model ===')
chat_response = requests.post(
    'https://openrouter.io/api/v1/chat/completions',
    headers={
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    },
    json={
        'model': 'google/gemini-2.0-flash-exp:free',
        'messages': [{'role': 'user', 'content': 'Hello'}],
        'max_tokens': 10
    },
    timeout=10
)
print(f'Chat (Gemini) Status: {chat_response.status_code}')
if chat_response.status_code != 200:
    print(f'Error: {chat_response.text[:300]}')
else:
    print('SUCCESS: Gemini model works!')

print('\nDiagnostic complete.')
