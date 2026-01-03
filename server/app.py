import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import requests
import pandas as pd

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for all routes - allow Vite dev server and other origins
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:5173", 
            "http://localhost:4173", 
            "http://127.0.0.1:5173", 
            "http://127.0.0.1:4173",
            "http://localhost:8080", 
            "http://localhost:3000", 
            "http://127.0.0.1:8080"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Set up database URI (using SQLite for simplicity)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///neurotradx.db'  # Change to PostgreSQL/MySQL in production
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
STEADY_API_TOKEN = os.getenv('STEADY_API_TOKEN')

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

@app.route('/news', methods=['GET'])
def get_news():
    """Fetch market news from Steady API"""
    if not STEADY_API_TOKEN:
        return jsonify({"error": "STEADY_API_TOKEN is not configured"}), 500
    
    # Get tickers from query params or use defaults
    tickers = request.args.get('ticker', 'AAPL,TSLA,GOOGL,MSFT')
    
    news_url = 'https://api.steadyapi.com/v1/markets/news'
    params = {'ticker': tickers}
    headers = {'Authorization': f'Bearer {STEADY_API_TOKEN}'}
    
    try:
        response = requests.get(news_url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        news_data = response.json()
        return jsonify(news_data), 200
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e), "message": "Failed to fetch news from API"}), 500

# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True)