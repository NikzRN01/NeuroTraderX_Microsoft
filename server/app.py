import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import requests

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for frontend communication
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:8080", "http://localhost:3000", "http://127.0.0.1:8080"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Set up database URI (using SQLite for simplicity)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///neurotradx.db'  # Change to PostgreSQL/MySQL in production
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')  

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    financial_goal = db.Column(db.String(200), nullable=True)
    risk_tolerance = db.Column(db.String(100), nullable=True)
    investment_preference = db.Column(db.String(200), nullable=True)

# Initialize the database
with app.app_context():
    db.create_all()


@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    # Check if username already exists
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400
    
    # Create a new user
    new_user = User(username=username, password=password)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "User registered successfully"}), 201

# Route to login users
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Check if the user exists with the correct password
    user = User.query.filter_by(username=username, password=password).first()
    
    if not user:
        return jsonify({"error": "Invalid username or password"}), 400
    
    return jsonify({"message": "Login successful", "user_id": user.id}), 200

# Route to update user's financial goal and preferences
@app.route('/update_preferences', methods=['POST'])
def update_preferences():
    data = request.get_json()
    user_id = data.get('user_id')
    financial_goal = data.get('financial_goal')
    risk_tolerance = data.get('risk_tolerance')
    investment_preference = data.get('investment_preference')

    # Fetch user data from the database
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Update the user's preferences
    user.financial_goal = financial_goal
    user.risk_tolerance = risk_tolerance
    user.investment_preference = investment_preference
    db.session.commit()

    return jsonify({"message": "Preferences updated successfully"}), 200


@app.route("/")
def home():
    return "Hello"

# Mock AI responses for testing (when Gemini quota is exhausted)
MOCK_AI_RESPONSES = [
    "Based on your tech stock portfolio, consider taking profits on high-volatility stocks and reinvesting in stable dividend payers.",
    "Tech stocks have strong growth potential, but ensure you have adequate diversification across sectors to manage risk.",
    "If you're bullish on tech, consider dollar-cost averaging your investments to smooth out market volatility.",
    "Your tech exposure looks reasonable. I'd recommend adding some defensive positions in healthcare or utilities.",
    "Tech sector fundamentals remain strong. Focus on companies with solid earnings growth and reasonable valuations."
]

@app.route('/api/chat', methods=['POST'])
def ai_chat():
    """Chat with OpenRouter AI for investment advice"""
    try:
        data = request.get_json()
        user_message = data.get('message') if data else None
        
        if not user_message:
            return jsonify({"error": "Message is required"}), 400
        
        print(f"DEBUG: Received message: {user_message[:50]}...")
        print(f"DEBUG: OPENROUTER_API_KEY is set: {bool(OPENROUTER_API_KEY)}")
        
        if not OPENROUTER_API_KEY:
            print("DEBUG: No API key, using mock response")
            import random
            mock_response = random.choice(MOCK_AI_RESPONSES)
            return jsonify({"response": mock_response}), 200
        
        openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:8080",
            "X-Title": "NeuroTradeX"
        }
        
        payload = {
            "model": "openai/gpt-3.5-turbo",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a professional investment advisor for NeuroTradeX. Answer investment-related questions concisely and helpfully."
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ],
            "max_tokens": 500
        }
        
        print("DEBUG: Sending request to OpenRouter...")
        response = requests.post(openrouter_url, json=payload, headers=headers, timeout=30)
        print(f"DEBUG: OpenRouter response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            ai_response = result.get('choices', [{}])[0].get('message', {}).get('content', 'Unable to generate response')
            print(f"DEBUG: Real API response: {ai_response[:50]}...")
            return jsonify({"response": ai_response}), 200
        else:
            print(f"DEBUG: OpenRouter API error {response.status_code}: {response.text[:200]}")
            import random
            mock_response = random.choice(MOCK_AI_RESPONSES)
            return jsonify({"response": mock_response}), 200
    
    except requests.exceptions.Timeout:
        print("DEBUG: Request timeout")
        import random
        return jsonify({"response": random.choice(MOCK_AI_RESPONSES)}), 200
    except Exception as e:
        print(f"DEBUG: Exception in ai_chat: {type(e).__name__}: {str(e)}")
        import random
        return jsonify({"response": random.choice(MOCK_AI_RESPONSES)}), 200

@app.route('/investment_strategy', methods=['POST'])
def investment_strategy():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON request body"}), 400

    user_id = data.get('user_id')
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if not OPENROUTER_API_KEY:
        return jsonify({"error": "AI service not configured"}), 500
    
    try:
        # Call OpenRouter API for personalized strategy
        openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:8080",
            "X-Title": "NeuroTradeX"
        }
        
        strategy_prompt = f"""Based on the following investor profile, provide a personalized investment strategy:
        Financial Goal: {user.financial_goal}
        Risk Tolerance: {user.risk_tolerance}
        Investment Preference: {user.investment_preference}
        
        Provide specific, actionable advice in 2-3 paragraphs."""
        
        payload = {
            "model": "openai/gpt-3.5-turbo",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a professional investment advisor providing personalized strategies."
                },
                {
                    "role": "user",
                    "content": strategy_prompt
                }
            ],
            "max_tokens": 800
        }
        
        response = requests.post(openrouter_url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            strategy = result.get('choices', [{}])[0].get('message', {}).get('content', 'Unable to generate strategy')
            return jsonify({"investment_strategy": strategy}), 200
        else:
            return jsonify({"error": "Failed to fetch investment strategy"}), 500
    
    except Exception as e:
        return jsonify({"error": f"Error fetching investment strategy: {str(e)}"}), 500

# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True)