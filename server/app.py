import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import requests
import pandas as pd
import yfinance as yf
import numpy as np
import random
import time
import json
from datetime import datetime, timedelta
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from sentiment_analysis import analyze_news_sentiment, get_sentiment_summary, analyze_single_text

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# In-memory cache for stock data
stock_cache = {}
CACHE_DURATION = 3600  # 1 hour in seconds

# API Keys
FINNHUB_API_KEY = os.getenv('FINNHUB_API_KEY', '')
TWELVEDATA_API_KEY = os.getenv('TWELVEDATA_API_KEY', '')
UPSTOX_ACCESS_TOKEN = os.getenv('UPSTOX_ACCESS_TOKEN', '')
# JSON mapping from your app symbols to Upstox instrument keys.
# Example: {"NIFTY50":"NSE_INDEX|Nifty 50","SENSEX":"BSE_INDEX|SENSEX"}
UPSTOX_INSTRUMENT_MAP = os.getenv('UPSTOX_INSTRUMENT_MAP', '')
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '')

# Database Configuration
# Preferred: DB (connection string). Backward compatible: DATABASE_URL.
DATABASE_URL = os.getenv('DB') or os.getenv('DATABASE_URL') or 'sqlite:///neurotradx.db'

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


@app.route('/portfolio', methods=['GET'])
def get_portfolio():
    """Return portfolio holdings for a user.

    Frontend sends user identity via `User-ID` header.
    """
    user_id_raw = request.headers.get('User-ID')
    if not user_id_raw:
        return jsonify({"error": "User-ID header is required"}), 400

    try:
        user_id = int(user_id_raw)
    except ValueError:
        return jsonify({"error": "User-ID must be an integer"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    holdings = Portfolio.query.filter_by(user_id=user_id).order_by(Portfolio.created_at.desc()).all()
    return jsonify({
        "user_id": user_id,
        "holdings": [
            {
                "id": h.id,
                "ticker": h.ticker,
                "quantity": h.quantity,
                "purchase_price": h.purchase_price,
                "purchase_date": h.purchase_date.isoformat() if h.purchase_date else None,
                "notes": h.notes,
                "created_at": h.created_at.isoformat() if h.created_at else None,
                "updated_at": h.updated_at.isoformat() if h.updated_at else None,
            }
            for h in holdings
        ],
    }), 200


@app.route('/portfolio', methods=['POST'])
def upload_portfolio():
    """Create portfolio holdings for a user.

    Frontend sends `{ user_id, portfolio_data }` where `portfolio_data` is expected
    to be an array of holdings (ticker/quantity/purchase_price) or an object containing
    a `holdings` array.
    """
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id')
    portfolio_data = data.get('portfolio_data')

    if user_id is None:
        return jsonify({"error": "user_id is required"}), 400

    try:
        user_id_int = int(user_id)
    except (TypeError, ValueError):
        return jsonify({"error": "user_id must be an integer"}), 400

    user = User.query.get(user_id_int)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if portfolio_data is None:
        return jsonify({"error": "portfolio_data is required"}), 400

    # Normalize to a list of holdings.
    holdings = None
    if isinstance(portfolio_data, list):
        holdings = portfolio_data
    elif isinstance(portfolio_data, dict):
        if isinstance(portfolio_data.get('holdings'), list):
            holdings = portfolio_data.get('holdings')
        else:
            # Single holding object
            holdings = [portfolio_data]
    else:
        return jsonify({"error": "portfolio_data must be a list or object"}), 400

    created = []
    for idx, item in enumerate(holdings):
        if not isinstance(item, dict):
            return jsonify({"error": f"holding at index {idx} must be an object"}), 400

        ticker = (item.get('ticker') or item.get('symbol') or '').strip().upper()
        if not ticker:
            return jsonify({"error": f"holding at index {idx} is missing ticker"}), 400

        try:
            quantity = float(item.get('quantity'))
        except (TypeError, ValueError):
            return jsonify({"error": f"holding {ticker} has invalid quantity"}), 400

        try:
            purchase_price = float(item.get('purchase_price') if 'purchase_price' in item else item.get('purchasePrice'))
        except (TypeError, ValueError):
            return jsonify({"error": f"holding {ticker} has invalid purchase_price"}), 400

        notes = item.get('notes')

        rec = Portfolio(
            user_id=user_id_int,
            ticker=ticker,
            quantity=quantity,
            purchase_price=purchase_price,
            notes=notes,
        )
        db.session.add(rec)
        created.append(rec)

    db.session.commit()

    return jsonify({
        "message": "Portfolio saved successfully",
        "created": [
            {
                "id": h.id,
                "ticker": h.ticker,
                "quantity": h.quantity,
                "purchase_price": h.purchase_price,
            }
            for h in created
        ],
    }), 201


@app.route('/watchlist', methods=['GET'])
def get_watchlist():
    """Return watchlist items for a user.

    Uses `User-ID` header for user identity (same pattern as GET /portfolio).
    """
    user_id_raw = request.headers.get('User-ID')
    if not user_id_raw:
        return jsonify({"error": "User-ID header is required"}), 400

    try:
        user_id = int(user_id_raw)
    except ValueError:
        return jsonify({"error": "User-ID must be an integer"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    items = Watchlist.query.filter_by(user_id=user_id).order_by(Watchlist.created_at.desc()).all()
    return jsonify({
        "user_id": user_id,
        "watchlist": [
            {
                "id": w.id,
                "ticker": w.ticker,
                "target_price": w.target_price,
                "notes": w.notes,
                "created_at": w.created_at.isoformat() if w.created_at else None,
            }
            for w in items
        ],
    }), 200


@app.route('/watchlist', methods=['POST'])
def add_watchlist_item():
    """Add one or more watchlist items for a user.

    Accepts:
      - { user_id, ticker, target_price?, notes? }
      - { user_id, watchlist_data: [...] } where items contain ticker/target_price/notes
    """
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id')
    if user_id is None:
        return jsonify({"error": "user_id is required"}), 400

    try:
        user_id_int = int(user_id)
    except (TypeError, ValueError):
        return jsonify({"error": "user_id must be an integer"}), 400

    user = User.query.get(user_id_int)
    if not user:
        return jsonify({"error": "User not found"}), 404

    payload = data.get('watchlist_data')
    if payload is None:
        payload = [{
            "ticker": data.get('ticker'),
            "target_price": data.get('target_price') if 'target_price' in data else data.get('targetPrice'),
            "notes": data.get('notes'),
        }]

    if isinstance(payload, dict):
        payload = [payload]

    if not isinstance(payload, list):
        return jsonify({"error": "watchlist_data must be a list or object"}), 400

    created = []
    for idx, item in enumerate(payload):
        if not isinstance(item, dict):
            return jsonify({"error": f"watchlist item at index {idx} must be an object"}), 400

        ticker = (item.get('ticker') or item.get('symbol') or '').strip().upper()
        if not ticker:
            return jsonify({"error": f"watchlist item at index {idx} is missing ticker"}), 400

        target_price = item.get('target_price') if 'target_price' in item else item.get('targetPrice')
        if target_price is not None and target_price != "":
            try:
                target_price = float(target_price)
            except (TypeError, ValueError):
                return jsonify({"error": f"watchlist item {ticker} has invalid target_price"}), 400
        else:
            target_price = None

        rec = Watchlist(
            user_id=user_id_int,
            ticker=ticker,
            target_price=target_price,
            notes=item.get('notes'),
        )
        db.session.add(rec)
        created.append(rec)

    db.session.commit()

    return jsonify({
        "message": "Watchlist saved successfully",
        "created": [
            {
                "id": w.id,
                "ticker": w.ticker,
                "target_price": w.target_price,
            }
            for w in created
        ],
    }), 201


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


@app.route('/analyze', methods=['POST'])
def analyze_portfolio():
    """Basic portfolio analysis endpoint.

    Frontend sends JSON:
      { tickers: string[], start_date: string, end_date: string }
    """
    data = request.get_json(silent=True) or {}
    tickers = data.get('tickers')
    start_date = data.get('start_date')
    end_date = data.get('end_date')

    if not isinstance(tickers, list) or not tickers:
        return jsonify({"error": "tickers must be a non-empty array"}), 400
    if not start_date or not end_date:
        return jsonify({"error": "start_date and end_date are required"}), 400

    # Fetch adjusted close prices.
    prices = None
    try:
        prices = yf.download(tickers, start=start_date, end=end_date, progress=False)
        if isinstance(prices, pd.DataFrame) and 'Adj Close' in prices.columns:
            prices = prices['Adj Close']
        elif isinstance(prices, pd.DataFrame) and 'Close' in prices.columns:
            prices = prices['Close']
    except Exception:
        prices = None

    if prices is None or getattr(prices, 'empty', True):
        # Fallback: return a mock analysis when market data is unavailable.
        num_assets = len(tickers)
        weights = (np.ones(num_assets) / num_assets).tolist() if num_assets else []
        return jsonify({
            "tickers": tickers,
            "weights": weights,
            "portfolio_return": 0.10,
            "portfolio_risk": 0.18,
            "sharpe_ratio": 0.44,
            "risk_assessment": None,
            "dataSource": "mock",
        }), 200

    returns = prices.pct_change().dropna(how='any')
    if returns.empty:
        return jsonify({"error": "Not enough data to calculate returns"}), 400

    mean_returns = returns.mean()
    cov_matrix = returns.cov()
    num_assets = len(mean_returns)
    if num_assets == 0:
        return jsonify({"error": "No assets to analyze"}), 400

    # Simple random-weight portfolio (baseline).
    weights = np.random.random(num_assets)
    weights = weights / np.sum(weights)
    risk_free_rate = 0.02

    portfolio_return = float(np.sum(weights * mean_returns) * 252)
    portfolio_stddev = float(np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights))) * np.sqrt(252))
    sharpe_ratio = float((portfolio_return - risk_free_rate) / portfolio_stddev) if portfolio_stddev else 0.0

    # Optional AI risk assessment (best-effort, falls back silently).
    risk_assessment = None
    if OPENROUTER_API_KEY:
        try:
            payload = {
                "model": "openai/gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": "You are a professional investment risk analyst. Provide a concise risk assessment."},
                    {"role": "user", "content": f"Analyze the risk profile of this portfolio: tickers={tickers}, weights={weights.tolist()}, annualized_vol={portfolio_stddev:.4f}, sharpe={sharpe_ratio:.2f}"},
                ],
                "max_tokens": 250,
            }
            headers = {"Authorization": f"Bearer {OPENROUTER_API_KEY}", "Content-Type": "application/json"}
            r = requests.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers, timeout=20)
            if r.status_code == 200:
                risk_assessment = r.json().get('choices', [{}])[0].get('message', {}).get('content')
        except Exception:
            risk_assessment = None

    return jsonify({
        "tickers": tickers,
        "weights": weights.tolist(),
        "portfolio_return": portfolio_return,
        "portfolio_risk": portfolio_stddev,
        "sharpe_ratio": sharpe_ratio,
        "risk_assessment": risk_assessment,
    }), 200


def _calculate_tax_liability(portfolio):
    short_term_gains = 0.0
    long_term_gains = 0.0
    stt_tax = 0.0
    ltcg_tax = 0.0

    if not portfolio:
        return {"error": "No portfolio data provided."}

    for asset in portfolio:
        if not isinstance(asset, dict):
            continue
        asset_type = str(asset.get('type', '')).lower()
        purchase_date = asset.get('purchase_date')
        purchase_price = asset.get('purchase_price', 0)
        current_price = asset.get('current_price', 0)
        quantity = asset.get('quantity', 0)

        if not purchase_date or not purchase_price or not current_price or not quantity:
            continue

        try:
            holding_period = (datetime.now() - datetime.strptime(purchase_date, "%Y-%m-%d")).days
            gain = (float(current_price) - float(purchase_price)) * float(quantity)
        except Exception:
            continue

        if asset_type in ['stock', 'mutual_fund', 'crypto', 'gold']:
            if holding_period <= 365:
                short_term_gains += gain
            else:
                long_term_gains += gain

    # Tax is applied on net positive gains (losses can offset gains).
    stt_tax = max(0.0, short_term_gains) * 0.15
    ltcg_tax = max(0.0, long_term_gains) * 0.10

    return {
        "short_term_gains": short_term_gains,
        "long_term_gains": long_term_gains,
        "stt_tax": stt_tax,
        "ltcg_tax": ltcg_tax,
        "total_tax": stt_tax + ltcg_tax,
    }


@app.route('/api/submit_portfolio', methods=['POST'])
def submit_portfolio_for_tax():
    data = request.get_json(silent=True) or {}
    portfolio = data.get('portfolio', [])
    if not portfolio:
        return jsonify({"error": "No portfolio data provided."}), 400
    tax_summary = _calculate_tax_liability(portfolio)
    if isinstance(tax_summary, dict) and tax_summary.get('error'):
        return jsonify(tax_summary), 400
    return jsonify({"tax_summary": tax_summary}), 200


@app.route('/fetch_data', methods=['POST'])
def fetch_market_data():
    """Fetch lightweight market data for a symbol.

    Expected JSON:
      { market_type: 'stocks'|'crypto'|'commodities', symbol: string, exchange?: string }
    """
    data = request.get_json(silent=True) or {}
    market_type = str(data.get('market_type', '')).lower()
    symbol = str(data.get('symbol', '')).strip()
    exchange = str(data.get('exchange', 'NSE')).upper()

    if not market_type or not symbol:
        return jsonify({"error": "market_type and symbol are required"}), 400

    if market_type in ['stock', 'stocks', 'equity']:
        yf_symbol = symbol
        if exchange == 'NSE':
            yf_symbol = f"{symbol}.NS"
        elif exchange == 'BSE':
            yf_symbol = f"{symbol}.BO"

        try:
            session = create_yfinance_session()
            stock = yf.Ticker(yf_symbol, session=session)
            hist = stock.history(period="5d")
            if hist is None or hist.empty or 'Close' not in hist.columns:
                mock = get_mock_stock_data(symbol)
                return jsonify({
                    "market_type": "stocks",
                    "symbol": symbol,
                    "exchange": exchange,
                    "last_close": mock.get('lastPrice'),
                    "change_pct": mock.get('priceChange'),
                    "dataSource": "mock",
                }), 200

            last_close = float(hist['Close'].iloc[-1])
            first_close = float(hist['Close'].iloc[0])
            change_pct = ((last_close - first_close) / first_close * 100) if first_close else 0.0
            return jsonify({
                "market_type": "stocks",
                "symbol": symbol,
                "exchange": exchange,
                "last_close": round(last_close, 2),
                "change_pct": round(change_pct, 2),
                "dataSource": "yahoo_finance",
            }), 200
        except Exception as e:
            mock = get_mock_stock_data(symbol)
            return jsonify({
                "market_type": "stocks",
                "symbol": symbol,
                "exchange": exchange,
                "last_close": mock.get('lastPrice'),
                "change_pct": mock.get('priceChange'),
                "dataSource": "mock",
                "warning": str(e),
            }), 200

    if market_type in ['crypto', 'cryptocurrency']:
        try:
            import ccxt  # type: ignore
        except Exception:
            return jsonify({"error": "ccxt is not installed on the backend"}), 500

        try:
            ex = ccxt.binance()
            ticker = ex.fetch_ticker(f"{symbol}/USDT")
            return jsonify({"market_type": "crypto", "symbol": symbol, "ticker": ticker}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    if market_type in ['commodity', 'commodities']:
        try:
            commodity = yf.Ticker(symbol)
            hist = commodity.history(period="5d")
            if hist.empty:
                return jsonify({"error": "No data found for commodity"}), 404
            last_close = float(hist['Close'].iloc[-1])
            return jsonify({"market_type": "commodities", "symbol": symbol, "last_close": round(last_close, 2)}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return jsonify({"error": f"Unsupported market_type '{market_type}'"}), 400


@app.route('/market-data', methods=['GET'])
def market_data_overview():
    """Market overview endpoint.

    Returns quotes via Twelve Data, with per-symbol fallback to Upstox V2.

    Order:
      1) Twelve Data for all symbols
      2) Upstox V2 ONLY for symbols that Twelve Data couldn't fetch
      3) If still insufficient, return non-200 so the frontend can fall back to mockData.ts
    """

    def _load_upstox_instrument_map():
        raw = (UPSTOX_INSTRUMENT_MAP or "").strip()
        if not raw:
            return {}
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            return {}

    def _twelvedata_quote(symbol: str):
        if not TWELVEDATA_API_KEY:
            return None
        try:
            r = requests.get(
                "https://api.twelvedata.com/quote",
                params={"symbol": symbol, "apikey": TWELVEDATA_API_KEY},
                timeout=10,
            )
            if r.status_code != 200:
                return None
            payload = r.json() if isinstance(r.json(), dict) else None
            if not payload:
                return None
            if str(payload.get("status", "")).lower() == "error":
                return None

            # Twelve Data fields are usually strings.
            value_raw = payload.get("close") or payload.get("price")
            change_raw = payload.get("change")
            pct_raw = payload.get("percent_change")

            if value_raw in (None, ""):
                return None
            value = float(value_raw)
            change = float(change_raw) if change_raw not in (None, "") else 0.0
            pct = float(pct_raw) if pct_raw not in (None, "") else 0.0

            return {
                "value": value,
                "change": change,
                "changePercentage": pct,
            }
        except Exception:
            return None

    def _upstox_quote(symbol: str):
        if not UPSTOX_ACCESS_TOKEN:
            return None
        instrument_map = _load_upstox_instrument_map()
        instrument_key = instrument_map.get(symbol)
        if not instrument_key:
            return None

        try:
            r = requests.get(
                "https://api.upstox.com/v2/market-quote/ltp",
                params={"instrument_key": instrument_key},
                headers={
                    "Authorization": f"Bearer {UPSTOX_ACCESS_TOKEN}",
                    "Accept": "application/json",
                },
                timeout=10,
            )
            if r.status_code != 200:
                return None
            payload = r.json() if isinstance(r.json(), dict) else None
            if not payload:
                return None
            if str(payload.get("status", "")).lower() not in ("success", "ok"):
                return None

            data = payload.get("data")
            if not isinstance(data, dict) or not data:
                return None

            entry = data.get(instrument_key)
            if entry is None:
                # Some responses use a single nested object; fall back to first value.
                entry = next(iter(data.values()), None)
            if not isinstance(entry, dict):
                return None

            lp = entry.get("last_price")
            if lp in (None, ""):
                lp = entry.get("ltp")
            if lp in (None, ""):
                return None

            value = float(lp)
            return {
                "value": value,
                # Upstox LTP endpoint may not include change/percent reliably.
                "change": 0.0,
                "changePercentage": 0.0,
            }
        except Exception:
            return None

    # Show exactly: SPY / QQQ / DIA / NIFTY / SENSEX
    # - US ETFs come from Twelve Data (preferred)
    # - Indian indices come from Upstox (preferred) via UPSTOX_INSTRUMENT_MAP
    index_proxies = [
        {"name": "S&P 500 (SPY)", "symbol": "SPY", "preferred": "twelvedata"},
        {"name": "Nasdaq 100 (QQQ)", "symbol": "QQQ", "preferred": "twelvedata"},
        {"name": "Dow Jones (DIA)", "symbol": "DIA", "preferred": "twelvedata"},
        {"name": "Russell 2000 (IWM)", "symbol": "IWM", "preferred": "twelvedata"},
        {"name": "Nifty 50", "symbol": "NIFTY50", "preferred": "upstox"},
        {"name": "Sensex", "symbol": "SENSEX", "preferred": "upstox"},
    ]

    trending = [
        {"name": "Apple", "symbol": "AAPL"},
        {"name": "Microsoft", "symbol": "MSFT"},
        {"name": "Alphabet", "symbol": "GOOGL"},
        {"name": "Tesla", "symbol": "TSLA"},
    ]

    def _build_overview(indices_input, trending_input):
        indices_out_local = []
        trending_out_local = []
        missing_symbols = []

        instrument_map = _load_upstox_instrument_map()

        for it in indices_input:
            symbol = it["symbol"]
            preferred = it.get("preferred")
            # Prefer Upstox for Indian indices, Twelve Data for US ETFs.
            if preferred == "upstox":
                q = _upstox_quote(symbol) or _twelvedata_quote(symbol)
            else:
                q = _twelvedata_quote(symbol) or _upstox_quote(symbol)
            if q:
                indices_out_local.append({
                    "name": it["name"],
                    "value": round(q["value"], 2),
                    "change": round(q["change"], 2),
                    "changePercentage": round(q["changePercentage"], 2),
                })
            else:
                missing_symbols.append({
                    "symbol": symbol,
                    "hasUpstoxMapping": bool(instrument_map.get(symbol)),
                })

        for it in trending_input:
            symbol = it["symbol"]
            q = _twelvedata_quote(symbol)
            if not q:
                q = _upstox_quote(symbol)
            if q:
                trending_out_local.append({
                    "name": it["name"],
                    "symbol": it["symbol"],
                    "value": round(q["value"], 2),
                    "change": round(q["change"], 2),
                    "changePercentage": round(q["changePercentage"], 2),
                })
            else:
                missing_symbols.append({
                    "symbol": symbol,
                    "hasUpstoxMapping": bool(instrument_map.get(symbol)),
                })

        return indices_out_local, trending_out_local, missing_symbols

    indices_out, trending_out, missing = _build_overview(index_proxies, trending)
    if len(indices_out) >= 3 and trending_out:
        return jsonify({
            "status": "ok",
            "defaults": ["AAPL", "MSFT", "GOOGL", "TSLA"],
            "indices": indices_out,
            "trendingStocks": trending_out,
            "dataSource": "twelvedata_upstox",
        }), 200

    # If we can't fetch enough provider data, fall back to mock data with HTTP 200.
    # This avoids noisy 503s in Docker/dev when API keys aren't configured.
    def _mock_quote(symbol: str):
        mock = get_mock_stock_data(symbol)
        value = float(mock.get("lastPrice") or 0.0)
        pct = float(mock.get("priceChange") or 0.0)
        change = (value * pct / 100.0) if value else 0.0
        return {
            "value": value,
            "change": change,
            "changePercentage": pct,
        }

    used_mock = False
    instrument_map = _load_upstox_instrument_map()

    indices_fallback = []
    for it in index_proxies:
        symbol = it["symbol"]
        preferred = it.get("preferred")
        if preferred == "upstox":
            q = _upstox_quote(symbol) or _twelvedata_quote(symbol)
        else:
            q = _twelvedata_quote(symbol) or _upstox_quote(symbol)
        if not q:
            q = _mock_quote(symbol)
            used_mock = True

        indices_fallback.append({
            "name": it["name"],
            "value": round(float(q["value"]), 2),
            "change": round(float(q["change"]), 2),
            "changePercentage": round(float(q["changePercentage"]), 2),
        })

    trending_fallback = []
    for it in trending:
        symbol = it["symbol"]
        q = _twelvedata_quote(symbol) or _upstox_quote(symbol)
        if not q:
            q = _mock_quote(symbol)
            used_mock = True

        trending_fallback.append({
            "name": it["name"],
            "symbol": it["symbol"],
            "value": round(float(q["value"]), 2),
            "change": round(float(q["change"]), 2),
            "changePercentage": round(float(q["changePercentage"]), 2),
        })

    return jsonify({
        "status": "ok",
        "defaults": ["AAPL", "MSFT", "GOOGL", "TSLA"],
        "indices": indices_fallback,
        "trendingStocks": trending_fallback,
        "dataSource": "mock" if used_mock else "twelvedata_upstox",
        "providerFallback": True,
        "providerDiagnostics": {
            "indicesCount": len(indices_out),
            "trendingCount": len(trending_out),
            "twelvedataConfigured": bool(TWELVEDATA_API_KEY),
            "upstoxConfigured": bool(UPSTOX_ACCESS_TOKEN),
            "missingSymbols": missing,
            "upstoxInstrumentMapConfigured": bool(instrument_map),
        },
    }), 200


@app.route('/predict', methods=['POST'])
def predict_prices():
    """Lightweight future price projection without heavy ML dependencies."""
    data = request.get_json(silent=True) or {}
    symbol = str(data.get('symbol', '')).strip().upper()
    days = data.get('days')
    future_days = data.get('future_days')
    initial_investment = data.get('initial_investment')

    if not symbol:
        return jsonify({"error": "symbol is required"}), 400
    try:
        days = int(days)
        future_days = int(future_days)
        initial_investment = float(initial_investment)
    except (TypeError, ValueError):
        return jsonify({"error": "days, future_days, initial_investment must be numeric"}), 400

    try:
        session = create_yfinance_session()
        hist = yf.Ticker(symbol, session=session).history(period=f"{days}d")
    except Exception:
        hist = None

    closes = None
    if hist is not None and not hist.empty and 'Close' in hist.columns:
        closes = hist['Close'].dropna()

    if closes is None or closes.empty:
        # Fallback: generate a mock forecast.
        mock = get_mock_stock_data(symbol)
        last_close = float(mock.get('lastPrice') or 100.0)
        mean_return = 0.001
        vol = 0.02

        start_date = datetime.utcnow().date()
        forecast = []
        simulated = []
        cur_price = last_close
        cur_invest = initial_investment
        for i in range(1, future_days + 1):
            shock = float(np.random.normal(0.0, vol))
            step_ret = mean_return + shock
            cur_price = max(0.01, cur_price * (1 + step_ret))
            cur_invest = max(0.01, cur_invest * (1 + step_ret))
            forecast.append({
                "date": (start_date + timedelta(days=i)).isoformat(),
                "price": round(cur_price, 2),
            })
            simulated.append({
                "date": (start_date + timedelta(days=i)).isoformat(),
                "value": round(cur_invest, 2),
            })

        return jsonify({
            "symbol": symbol,
            "last_close": round(last_close, 2),
            "mean_daily_return": mean_return,
            "daily_volatility": vol,
            "forecast": forecast,
            "simulated_investment": simulated,
            "dataSource": "mock",
        }), 200

    daily_returns = closes.pct_change().dropna()
    mean_return = float(daily_returns.mean()) if not daily_returns.empty else 0.0
    vol = float(daily_returns.std()) if not daily_returns.empty else 0.0

    last_close = float(closes.iloc[-1])
    start_date = datetime.utcnow().date()

    forecast = []
    simulated = []
    cur_price = last_close
    cur_invest = initial_investment

    for i in range(1, future_days + 1):
        # Simple drift model + stochastic shock.
        shock = float(np.random.normal(0.0, vol)) if vol else 0.0
        step_ret = mean_return + shock
        cur_price = max(0.01, cur_price * (1 + step_ret))
        cur_invest = max(0.01, cur_invest * (1 + step_ret))
        forecast.append({
            "date": (start_date + timedelta(days=i)).isoformat(),
            "price": round(cur_price, 2),
        })
        simulated.append({
            "date": (start_date + timedelta(days=i)).isoformat(),
            "value": round(cur_invest, 2),
        })

    return jsonify({
        "symbol": symbol,
        "last_close": round(last_close, 2),
        "mean_daily_return": mean_return,
        "daily_volatility": vol,
        "forecast": forecast,
        "simulated_investment": simulated,
        "dataSource": "yahoo_finance",
    }), 200


@app.route('/insights', methods=['POST'])
def batch_insights():
    """Batch insights endpoint (symbols + intervals)."""
    data = request.get_json(silent=True) or {}
    symbols = data.get('symbols')
    intervals = data.get('intervals')

    if not isinstance(symbols, list) or not symbols:
        return jsonify({"error": "symbols must be a non-empty array"}), 400
    if not isinstance(intervals, list) or not intervals:
        return jsonify({"error": "intervals must be a non-empty array"}), 400

    out = []
    for symbol in symbols:
        sym = str(symbol).strip().upper()
        if not sym:
            continue
        for d in intervals:
            try:
                days = int(d)
            except (TypeError, ValueError):
                continue
            try:
                session = create_yfinance_session()
                hist = yf.Ticker(sym, session=session).history(period=f"{days}d")
                if hist is None or hist.empty:
                    mock = get_mock_stock_data(sym)
                    out.append({
                        "symbol": sym,
                        "days": days,
                        "lastPrice": mock.get('lastPrice'),
                        "priceChange": mock.get('priceChange'),
                        "dayHigh": mock.get('dayHigh'),
                        "marketCap": mock.get('marketCap'),
                        "dataSource": "mock",
                    })
                    continue
                last_price = float(hist['Close'].iloc[-1])
                first_price = float(hist['Close'].iloc[0])
                change_pct = ((last_price - first_price) / first_price * 100) if first_price else 0.0
                volume = float(hist['Volume'].iloc[-1]) if 'Volume' in hist.columns else None
                day_low = float(hist['Low'].iloc[-1]) if 'Low' in hist.columns else None
                day_high = float(hist['High'].iloc[-1]) if 'High' in hist.columns else None

                out.append({
                    "symbol": sym,
                    "days": days,
                    "lastPrice": round(last_price, 2),
                    "priceChange": round(change_pct, 2),
                    "volume": volume,
                    "dayLow": round(day_low, 2) if isinstance(day_low, (int, float)) else None,
                    "dayHigh": round(day_high, 2) if isinstance(day_high, (int, float)) else None,
                    "dataSource": "yahoo_finance",
                })
            except Exception as e:
                mock = get_mock_stock_data(sym)
                out.append({
                    "symbol": sym,
                    "days": days,
                    "lastPrice": mock.get('lastPrice'),
                    "priceChange": mock.get('priceChange'),
                    "dayHigh": mock.get('dayHigh'),
                    "marketCap": mock.get('marketCap'),
                    "dataSource": "mock",
                    "warning": str(e),
                })

    return jsonify({"results": out}), 200


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
    """Fetch market news from Steady API with sentiment analysis"""
    # Get tickers from query params or use defaults
    tickers = request.args.get('ticker', 'AAPL,TSLA,GOOGL,MSFT')
    # Check if sentiment analysis should be included
    include_sentiment = request.args.get('sentiment', 'true').lower() == 'true'

    # SteadyAPI can return 401/403 depending on plan/token validity.
    # To avoid breaking the UI, fall back to Finnhub (preferred) or mock.
    if not STEADY_API_TOKEN:
        finnhub_payload = fetch_news_from_finnhub(tickers)
        if finnhub_payload:
            finnhub_payload["warning"] = "STEADY_API_TOKEN is not configured; returned Finnhub news instead"
            # Add sentiment analysis
            if include_sentiment and finnhub_payload.get('body'):
                finnhub_payload['body'] = analyze_news_sentiment(finnhub_payload['body'])
                finnhub_payload['sentimentSummary'] = get_sentiment_summary(finnhub_payload['body'])
            return jsonify(finnhub_payload), 200
        mock_payload = get_mock_news_payload(
            tickers,
            warning="STEADY_API_TOKEN is not configured and Finnhub is unavailable; returning mock news"
        )
        if include_sentiment and mock_payload.get('body'):
            mock_payload['body'] = analyze_news_sentiment(mock_payload['body'])
            mock_payload['sentimentSummary'] = get_sentiment_summary(mock_payload['body'])
        return jsonify(mock_payload), 200

    news_url = 'https://api.steadyapi.com/v1/markets/news'
    params = {'ticker': tickers}
    headers = {'Authorization': f'Bearer {STEADY_API_TOKEN}'}

    try:
        response = requests.get(news_url, headers=headers, params=params, timeout=10)
        if response.status_code == 200:
            try:
                payload = response.json()
                # Add sentiment analysis to news items
                if include_sentiment and payload.get('body'):
                    payload['body'] = analyze_news_sentiment(payload['body'])
                    payload['sentimentSummary'] = get_sentiment_summary(payload['body'])
                return jsonify(payload), 200
            except ValueError:
                mock_payload = get_mock_news_payload(
                    tickers,
                    warning="SteadyAPI returned non-JSON response; returning mock news",
                    upstream_status=200,
                )
                if include_sentiment and mock_payload.get('body'):
                    mock_payload['body'] = analyze_news_sentiment(mock_payload['body'])
                    mock_payload['sentimentSummary'] = get_sentiment_summary(mock_payload['body'])
                return jsonify(mock_payload), 200

        finnhub_payload = fetch_news_from_finnhub(tickers)
        if finnhub_payload:
            finnhub_payload["warning"] = f"SteadyAPI request failed ({response.status_code}); returned Finnhub news instead"
            finnhub_payload["upstreamStatus"] = response.status_code
            if include_sentiment and finnhub_payload.get('body'):
                finnhub_payload['body'] = analyze_news_sentiment(finnhub_payload['body'])
                finnhub_payload['sentimentSummary'] = get_sentiment_summary(finnhub_payload['body'])
            return jsonify(finnhub_payload), 200

        mock_payload = get_mock_news_payload(
            tickers,
            warning=f"SteadyAPI request failed ({response.status_code}); returning mock news",
            upstream_status=response.status_code,
        )
        if include_sentiment and mock_payload.get('body'):
            mock_payload['body'] = analyze_news_sentiment(mock_payload['body'])
            mock_payload['sentimentSummary'] = get_sentiment_summary(mock_payload['body'])
        return jsonify(mock_payload), 200
    except requests.exceptions.RequestException as e:
        finnhub_payload = fetch_news_from_finnhub(tickers)
        if finnhub_payload:
            finnhub_payload["warning"] = f"SteadyAPI request error; returned Finnhub news instead"
            finnhub_payload["error"] = str(e)
            if include_sentiment and finnhub_payload.get('body'):
                finnhub_payload['body'] = analyze_news_sentiment(finnhub_payload['body'])
                finnhub_payload['sentimentSummary'] = get_sentiment_summary(finnhub_payload['body'])
            return jsonify(finnhub_payload), 200

        mock_payload = get_mock_news_payload(
            tickers,
            warning=f"SteadyAPI request error: {str(e)}; returning mock news"
        )
        if include_sentiment and mock_payload.get('body'):
            mock_payload['body'] = analyze_news_sentiment(mock_payload['body'])
            mock_payload['sentimentSummary'] = get_sentiment_summary(mock_payload['body'])
        return jsonify(mock_payload), 200


@app.route('/api/sentiment/analyze', methods=['POST'])
def analyze_sentiment():
    """Analyze sentiment of provided text using Azure AI Language"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'error': 'Missing required field: text'
            }), 400
        
        text = data.get('text', '')
        
        if not text or len(text.strip()) == 0:
            return jsonify({
                'error': 'Text cannot be empty'
            }), 400
        
        # Analyze sentiment
        result = analyze_single_text(text)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'sentiment': 'error'
        }), 500


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


def get_mock_news_payload(tickers_csv, warning=None, upstream_status=None):
    """Return mock news payload shaped like the SteadyAPI response.

    The frontend expects either an array or an object with `{ body: [...] }` where
    each item includes: title, description, pubDate, link.
    """
    tickers = [t.strip().upper() for t in str(tickers_csv or "").split(",") if t.strip()]
    if not tickers:
        tickers = ["AAPL", "TSLA", "GOOGL", "MSFT"]

    now = datetime.utcnow()
    templates = [
        "{t} sees increased volume amid broader market moves",
        "Analysts weigh in on {t} ahead of upcoming catalysts",
        "{t} trades mixed as investors digest macro signals",
        "What to watch next for {t}: key levels and sentiment",
    ]

    body = []
    for i in range(12):
        t = random.choice(tickers)
        pub = now - timedelta(hours=i * 3)
        title = random.choice(templates).format(t=t)
        body.append({
            "title": title,
            "description": f"Mock news item for {t}. Live news is unavailable right now.",
            "pubDate": pub.isoformat() + "Z",
            "link": f"https://finance.yahoo.com/quote/{t}",
        })

    payload = {
        "body": body,
        "meta": {
            "tickers": ",".join(tickers),
            "generatedAt": now.isoformat() + "Z",
        },
        "dataSource": "mock",
    }
    if warning:
        payload["warning"] = warning
    if upstream_status is not None:
        payload["upstreamStatus"] = upstream_status
    return payload


def fetch_news_from_finnhub(tickers_csv):
    """Fetch market news from Finnhub and normalize to `{ body: [...] }`.

    Finnhub endpoints used:
      - General: /news?category=general
      - Company: /company-news?symbol=...&from=YYYY-MM-DD&to=YYYY-MM-DD

    Returns:
      dict payload with keys: body, meta, dataSource
      or None if not configured / failed.
    """
    if not FINNHUB_API_KEY:
        return None

    tickers = [t.strip().upper() for t in str(tickers_csv or "").split(",") if t.strip()]
    if not tickers:
        tickers = ["AAPL", "TSLA", "GOOGL", "MSFT"]

    now = datetime.utcnow()
    try:
        # If a single ticker is requested, fetch company news for the last 7 days.
        if len(tickers) == 1:
            symbol = tickers[0]
            from_date = (now - timedelta(days=7)).date().isoformat()
            to_date = now.date().isoformat()
            url = "https://finnhub.io/api/v1/company-news"
            params = {"symbol": symbol, "from": from_date, "to": to_date, "token": FINNHUB_API_KEY}
            r = requests.get(url, params=params, timeout=10)
            if r.status_code != 200:
                return None
            items = r.json() if isinstance(r.json(), list) else []
        else:
            # For multiple tickers, avoid N requests; use general market news.
            url = "https://finnhub.io/api/v1/news"
            params = {"category": "general", "token": FINNHUB_API_KEY}
            r = requests.get(url, params=params, timeout=10)
            if r.status_code != 200:
                return None
            items = r.json() if isinstance(r.json(), list) else []

        body = []
        for it in items[:50]:
            if not isinstance(it, dict):
                continue
            dt = it.get("datetime")
            try:
                pub = datetime.utcfromtimestamp(int(dt)).isoformat() + "Z" if dt else now.isoformat() + "Z"
            except Exception:
                pub = now.isoformat() + "Z"
            body.append({
                "title": it.get("headline") or it.get("title") or "No title",
                "description": it.get("summary") or it.get("description") or "",
                "pubDate": pub,
                "link": it.get("url") or it.get("link") or "#",
            })

        return {
            "body": body,
            "meta": {
                "tickers": ",".join(tickers),
                "generatedAt": now.isoformat() + "Z",
                "provider": "finnhub",
            },
            "dataSource": "finnhub",
        }
    except Exception:
        return None

# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True)