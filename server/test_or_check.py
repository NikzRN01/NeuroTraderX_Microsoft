import os
import requests
from dotenv import load_dotenv

load_dotenv()
key = os.getenv('OPENROUTER_API_KEY')
print('Key present:', bool(key))
headers_base = {
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json',
    'HTTP-Referer': 'http://localhost:8080',
    'X-Title': 'NeuroTradeX'
}

r = requests.get('https://openrouter.ai/api/v1/models', headers={'Authorization': f'Bearer {key}'}, timeout=15)
print('Models status:', r.status_code)
print('Models head:', r.text[:200])

payload = {'model': 'openai/gpt-3.5-turbo', 'messages': [{'role': 'user', 'content': 'Hi'}], 'max_tokens': 8}
r2 = requests.post('https://openrouter.ai/api/v1/chat/completions', headers=headers_base, json=payload, timeout=15)
print('Chat gpt3.5 status:', r2.status_code)
print('Chat gpt3.5 head:', r2.text[:200])

payload2 = {'model': 'google/gemini-2.0-flash-exp:free', 'messages': [{'role': 'user', 'content': 'Hi'}], 'max_tokens': 8}
r3 = requests.post('https://openrouter.ai/api/v1/chat/completions', headers=headers_base, json=payload2, timeout=15)
print('Chat gemini status:', r3.status_code)
print('Chat gemini head:', r3.text[:200])
