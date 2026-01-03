import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('OPENROUTER_API_KEY')

# Test 1: Check raw response from models endpoint
print('=== Test 1: Check Models Endpoint Response ===')
models_response = requests.get(
    'https://openrouter.ai/api/v1/models',
    headers={'Authorization': f'Bearer {api_key}'},
    timeout=10
)
print(f'Status Code: {models_response.status_code}')
print(f'Response Length: {len(models_response.text)} characters')
print(f'Response Content: {models_response.text[:500]}...' if len(models_response.text) > 500 else f'Response Content: {models_response.text}')

# Test 2: Try chat endpoint with gpt-3.5
print('\n=== Test 2: Chat with GPT-3.5 ===')
chat_response = requests.post(
    'https://openrouter.ai/api/v1/chat/completions',
    headers={
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    },
    json={
        'model': 'openai/gpt-3.5-turbo',
        'messages': [{'role': 'user', 'content': 'Hi'}],
        'max_tokens': 10
    },
    timeout=10
)
print(f'Status Code: {chat_response.status_code}')
print(f'Response: {chat_response.text[:500]}')

# Test 3: Try Gemini
print('\n=== Test 3: Chat with Gemini 2.0 Flash ===')
chat_response = requests.post(
    'https://openrouter.ai/api/v1/chat/completions',
    headers={
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    },
    json={
        'model': 'google/gemini-2.0-flash-exp:free',
        'messages': [{'role': 'user', 'content': 'Hi'}],
        'max_tokens': 10
    },
    timeout=10
)
print(f'Status Code: {chat_response.status_code}')
print(f'Response: {chat_response.text[:500]}')
