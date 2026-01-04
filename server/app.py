import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import requests
import pandas as pd
import yfinance as yf
import random
import time
import json
from datetime import datetime, timedelta
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# In-memory cache for stock data
stock_cache = {}
CACHE_DURATION = 3600  # 1 hour in seconds

# API Keys
FINNHUB_API_KEY = os.getenv('FINNHUB_API_KEY', '')
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '')

# Database Configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///neurotradx.db')

def is_cache_valid(ticker):
    """Check if cached data is still valid"""
    if ticker not in stock_cache:
        return False
    cached = stock_cache[ticker]
    age = time.time() - cached['timestamp']
    return age < CACHE_DURATION

def get_cached_data(ticker):
    """Get data from cache if valid"""
    if is_cache_valid(ticker):
        print(f"DEBUG: Using cached data for {ticker}")
        return stock_cache[ticker]['data']
    return None

def set_cache(ticker, data):
    """Store data in cache with timestamp"""
    stock_cache[ticker] = {
        'data': data,
        'timestamp': time.time()
    }

def fetch_from_finnhub(ticker):
    """Fetch stock data from Finnhub API"""
    if not FINNHUB_API_KEY:
        print("DEBUG: Finnhub API key not configured")
        return None
    
    try:
        print(f"DEBUG: Fetching from Finnhub for {ticker}")
        # Get quote data
        quote_url = "https://finnhub.io/api/v1/quote"
        quote_params = {
            "symbol": ticker,
            "token": FINNHUB_API_KEY
        }
        quote_response = requests.get(quote_url, params=quote_params, timeout=10)
        quote_data = quote_response.json()
        
        if not quote_data.get('c'):  # 'c' is current price
            print(f"DEBUG: No price data from Finnhub for {ticker}")
            return None
        
        # Get company profile for additional info
        profile_url = "https://finnhub.io/api/v1/stock/profile2"
        profile_params = {
            "symbol": ticker,
            "token": FINNHUB_API_KEY
        }
        profile_response = requests.get(profile_url, params=profile_params, timeout=10)
        profile_data = profile_response.json()
        
        last_price = quote_data.get('c', 0)
        prev_close = quote_data.get('pc', last_price)
        price_change = ((last_price - prev_close) / prev_close * 100) if prev_close else 0
        
        data = {
            "source": "finnhub",
            "symbol": ticker,
            "lastPrice": round(last_price, 2),
            "priceChange": round(price_change, 2),
            "dayHigh": quote_data.get('h', 'N/A'),
            "marketCap": profile_data.get('marketCapitalization', 'N/A'),
            "summary": f"{ticker} trading at ${last_price:.2f}, {price_change:+.1f}% from previous close.",
            "timestamp": datetime.now().isoformat()
        }
        
        print(f"DEBUG: Successfully fetched from Finnhub for {ticker}")
        return data
        
    except Exception as e:
        print(f"DEBUG: Finnhub error for {ticker}: {str(e)}")
        return None
    """Create a requests session with retry strategy"""
    session = requests.Session()
    # Use minimal retries since Yahoo Finance is rate-limited
    retries = Retry(total=1, backoff_factor=0.5, status_forcelist=[429, 500, 502, 503, 504])
    session.mount('http://', HTTPAdapter(max_retries=retries))
    session.mount('https://', HTTPAdapter(max_retries=retries))
    return session


def create_yfinance_session():
    """Session helper for yfinance with light retry"""
    session = requests.Session()
    retries = Retry(total=1, backoff_factor=0.5, status_forcelist=[429, 500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retries)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    return session

def extract_ticker(query):
    """Extract stock ticker from query (e.g., 'AAPL STOCK OUTLOOK' -> 'AAPL')"""
    # Get first word and take only letters
    words = query.split()
    for word in words:
        # Extract only alphabetic characters
        ticker = ''.join(c for c in word if c.isalpha()).upper()
        # Valid tickers are 1-5 characters
        if 1 <= len(ticker) <= 5:
            return ticker
    # Fallback to first 5 letters if no valid word found
    return ''.join(c for c in query if c.isalpha()).upper()[:5]

# Enable CORS for all routes - allow Vite dev server and other origins
default_origins = [
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173",
    "http://localhost:8080",
    "http://localhost:3000",
    "http://127.0.0.1:8080",
]

# Optionally extend allowed origins (comma-separated) for deployed environments.
# Example: CORS_ALLOWED_ORIGINS=https://my-frontend.azurecontainerapps.io
extra_origins_raw = os.getenv("CORS_ALLOWED_ORIGINS", "")
extra_origins = [o.strip() for o in extra_origins_raw.split(",") if o.strip()]

CORS(app, resources={
    r"/*": {
        "origins": [*default_origins, *extra_origins],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "User-ID"],
    }
})

# Set up database URI (PostgreSQL for production, SQLite fallback)
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 10,
    'pool_recycle': 3600,
    'pool_pre_ping': True,  # Verify connections before using
}
db = SQLAlchemy(app)

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
STEADY_API_TOKEN = os.getenv('STEADY_API_TOKEN')

# Models
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False, index=True)
    password = db.Column(db.String(100), nullable=False)
    financial_goal = db.Column(db.String(200), nullable=True)
    risk_tolerance = db.Column(db.String(100), nullable=True)
    investment_preference = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    portfolios = db.relationship('Portfolio', backref='user', lazy=True, cascade='all, delete-orphan')
    watchlists = db.relationship('Watchlist', backref='user', lazy=True, cascade='all, delete-orphan')

class Portfolio(db.Model):
    __tablename__ = 'portfolios'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    ticker = db.Column(db.String(10), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    purchase_price = db.Column(db.Float, nullable=False)
    purchase_date = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Watchlist(db.Model):
    __tablename__ = 'watchlists'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    ticker = db.Column(db.String(10), nullable=False)
    target_price = db.Column(db.Float, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

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


@app.route('/api/mutual-funds', methods=['GET', 'OPTIONS'])
def get_mutual_funds():
    """Serve mutual funds data from the bundled CSV.

    Query params:
      - limit: number of rows to return (default 500, max 5000)
    """

    # Handle CORS preflight explicitly (Flask-CORS should also cover this)
    if request.method == 'OPTIONS':
        return ("", 204)

    try:
        limit_raw = request.args.get('limit', '500')
        limit = int(limit_raw)
        if limit <= 0:
            limit = 500
        limit = min(limit, 5000)

        csv_path = os.path.join(os.path.dirname(__file__), 'mutual_funds.csv')
        df = pd.read_csv(csv_path)
        rows = df.head(limit).fillna("").to_dict(orient='records')
        return jsonify({
            "rows": rows,
            "count": len(rows),
        }), 200
    except FileNotFoundError:
        return jsonify({"error": "mutual_funds.csv not found"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/insights', methods=['POST'])
def get_insights():
    """Generate AI-powered stock insights with smart fallback chain"""
    try:
        data = request.get_json()
        query = data.get('query', '').strip().upper()
        
        if not query:
            return jsonify({"error": "Query is required"}), 400
        
        # Extract just the ticker symbol
        ticker = extract_ticker(query)
        print(f"DEBUG: Original query: {query} -> Ticker: {ticker}")
        
        # Try to get cached data first
        cached_data = get_cached_data(ticker)
        if cached_data:
            ai_analysis = generate_stock_analysis(ticker, cached_data['lastPrice'], cached_data['priceChange'], cached_data.get('dayHigh', 'N/A'))
            response_data = {**cached_data, **ai_analysis}
            response_data['dataSource'] = 'cached'
            return jsonify(response_data), 200
        
        # Try Yahoo Finance
        try:
            session = create_yfinance_session()
            stock = yf.Ticker(ticker, session=session)
            hist = stock.history(period="5d")
            
            if hist.empty:
                time.sleep(0.5)
                hist = stock.history(period="1d")
            
            if not hist.empty:
                last_price = hist['Close'].iloc[-1]
                price_change = ((hist['Close'].iloc[-1] - hist['Close'].iloc[0]) / hist['Close'].iloc[0] * 100) if len(hist) > 1 else 0
                avg_volume = hist['Volume'].mean()
                
                try:
                    info = stock.info
                    # Use day high; more reliably available than 52-week high
                    day_high = info.get('dayHigh', 'N/A')
                    if day_high != 'N/A' and isinstance(day_high, (int, float)):
                        day_high = round(day_high, 2)
                    market_cap = info.get('marketCap', 'N/A')
                except:
                    day_high = 'N/A'
                    market_cap = 'N/A'
                
                period_text = f"{len(hist)} day(s)" if len(hist) > 0 else "recent period"
                summary = f"{ticker} is trading at ${last_price:.2f} with a {price_change:.1f}% change over the {period_text}. Today's high: ${day_high}."
                
                ai_analysis = generate_stock_analysis(ticker, last_price, price_change, day_high)
                
                response_data = {
                    "symbol": ticker,
                    "lastPrice": round(last_price, 2),
                    "priceChange": round(price_change, 2),
                    "dayHigh": day_high,
                    "marketCap": market_cap,
                    "summary": summary,
                    "dataSource": "yahoo_finance",
                    **ai_analysis
                }
                
                # Cache successful Yahoo Finance result
                set_cache(ticker, response_data)
                return jsonify(response_data), 200
        
        except Exception as yf_err:
            print(f"DEBUG: Yahoo Finance error: {str(yf_err)}")
        
        # Try Finnhub as fallback
        finnhub_data = fetch_from_finnhub(ticker)
        if finnhub_data:
            ai_analysis = generate_stock_analysis(ticker, finnhub_data['lastPrice'], finnhub_data['priceChange'], finnhub_data.get('dayHigh', 'N/A'))
            response_data = {**finnhub_data, **ai_analysis}
            # Cache Finnhub result
            set_cache(ticker, response_data)
            return jsonify(response_data), 200
        
        # Last resort: mock data
        print(f"DEBUG: Using mock data for {ticker}")
        mock_data = get_mock_stock_data(ticker)
        mock_data['dataSource'] = 'mock'
        return jsonify(mock_data), 200
    
    except Exception as e:
        print(f"DEBUG: Exception in get_insights: {str(e)}")
        return jsonify({"error": "Failed to generate insights"}), 500

def generate_stock_analysis(symbol, price, price_change, metric_value):
    """Generate AI-powered stock analysis with fallback"""
    try:
        if not OPENROUTER_API_KEY:
            return get_mock_analysis(symbol, price_change)
        
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:8080",
            "X-Title": "NeuroTradeX"
        }

        prompt = f"""
You are an equity analyst. Inputs: symbol {symbol}, last price ${price:.2f}, 60-day change {price_change:.1f}%, today's high {metric_value}.
Output JSON only (no prose, no markdown):
{{
  "prediction": "<=25 words, short-term (2-8 week) directional view with magnitude or range if possible",
  "recommendation": "Buy|Hold|Sell - <=25 words with risk caveat and trigger/stop hints",
  "riskLevel": "Low|Medium|High based on recent swing/volatility; avoid other labels",
  "confidence": 40-90 integer
}}
Keep it practical and realistic for a general investor (not a trader)."""
        
        payload = {
            "model": "openai/gpt-3.5-turbo",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a stock analyst. Respond ONLY with valid JSON, no markdown or extra text."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 200
        }
        
        response = requests.post("https://openrouter.ai/api/v1/chat/completions", 
                               headers=headers, json=payload, timeout=15)
        
        if response.status_code == 200:
            result = response.json()
            ai_text = result.get('choices', [{}])[0].get('message', {}).get('content', '')
            
            # Try to parse JSON from response
            try:
                import json
                analysis = json.loads(ai_text)
                return {
                    "prediction": analysis.get("prediction", "Positive outlook based on technical indicators"),
                    "recommendation": analysis.get("recommendation", "Hold current position"),
                    "riskLevel": analysis.get("riskLevel", "Medium"),
                    "confidence": analysis.get("confidence", 65)
                }
            except:
                pass
        
        return get_mock_analysis(symbol, price_change)
    
    except Exception as e:
        print(f"DEBUG: AI analysis error: {str(e)}")
        return get_mock_analysis(symbol, price_change)

def get_mock_analysis(symbol, price_change):
    """Fallback mock analysis tuned to recent move"""
    abs_change = abs(price_change)
    if abs_change >= 10:
        risk = "High"
    elif abs_change >= 4:
        risk = "Medium"
    else:
        risk = "Low"

    if price_change >= 5:
        prediction = f"{symbol} momentum is firm; modest upside likely over the next month"
        recommendation = "Buy - add on small pullbacks; use stops to protect gains"
        confidence = 68
    elif price_change <= -5:
        prediction = f"{symbol} under pressure; further drift lower is possible near term"
        recommendation = "Sell - trim exposure and wait for basing before re-entering"
        confidence = 62
    else:
        prediction = f"{symbol} likely to trade sideways in the short term"
        recommendation = "Hold - keep size steady until a clearer trend forms"
        confidence = 60

    # Nudge confidence toward risk profile
    if risk == "High":
        confidence = max(50, confidence - 5)
    elif risk == "Low":
        confidence = min(75, confidence + 4)

    return {
        "prediction": prediction,
        "recommendation": recommendation,
        "riskLevel": risk,
        "confidence": confidence
    }

def get_mock_stock_data(symbol):
    """Generate mock stock data when yfinance is unavailable"""
    # Common stock price ranges
    price_ranges = {
        "AAPL": (150, 200),
        "GOOGL": (130, 180),
        "MSFT": (350, 450),
        "TSLA": (200, 300),
        "AMZN": (140, 190),
        "NVDA": (400, 600),
        "META": (300, 500),
    }
    
    # Get price range or use default
    price_min, price_max = price_ranges.get(symbol, (50, 150))
    last_price = random.uniform(price_min, price_max)
    price_change = random.uniform(-8, 12)
    pe_ratio = random.uniform(15, 35)
    market_cap = random.randint(500, 3000) * 1000000000  # $500B - $3T
    
    summary = f"{symbol} has shown a {price_change:.1f}% change over the last 60 days. Current P/E ratio is {pe_ratio:.2f}. (Mock data due to rate limiting)"
    
    # Get AI analysis
    ai_analysis = generate_stock_analysis(symbol, last_price, price_change, round(last_price * 1.02, 2))
    
    return {
        "symbol": symbol,
        "lastPrice": round(last_price, 2),
        "priceChange": round(price_change, 2),
        "dayHigh": round(last_price * 1.02, 2),
        "marketCap": market_cap,
        "summary": summary,
        "prediction": ai_analysis["prediction"],
        "recommendation": ai_analysis["recommendation"],
        "riskLevel": ai_analysis["riskLevel"],
        "confidence": ai_analysis["confidence"]
    }

# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True)