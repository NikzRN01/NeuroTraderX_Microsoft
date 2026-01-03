import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import requests
import pandas as pd

# Initialize Flask app
app = Flask(__name__)

# Allow the Vite dev server (and other local tooling) to call this API.
# NOTE: tighten this in production.
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://localhost:4173", "http://127.0.0.1:5173", "http://127.0.0.1:4173"]}})

# Set up database URI (using SQLite for simplicity)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///neurotradx.db'  # Change to PostgreSQL/MySQL in production
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')  
GEMINI_ENDPOINT_URL = os.getenv("GEMINI_ENDPOINT_URL")

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


@app.route("/api/mutual-funds", methods=["GET"])
def mutual_funds():
    csv_path = os.path.join(os.path.dirname(__file__), "mutual_funds.csv")
    if not os.path.exists(csv_path):
        return jsonify({"error": "mutual_funds.csv not found"}), 404

    limit_raw = request.args.get("limit")
    try:
        limit = int(limit_raw) if limit_raw is not None else None
        if limit is not None:
            limit = max(1, min(limit, 2000))
    except ValueError:
        return jsonify({"error": "limit must be an integer"}), 400

    try:
        df = pd.read_csv(csv_path)
        if limit is not None:
            df = df.head(limit)

        # Ensure missing values become JSON null (not NaN).
        df = df.astype(object).where(pd.notnull(df), None)
        return jsonify({"rows": df.to_dict(orient="records")}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to read mutual_funds.csv: {str(e)}"}), 500

@app.route('/investment_strategy', methods=['POST'])
def investment_strategy():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON request body"}), 400

    if not GEMINI_API_KEY:
        return jsonify({"error": "GEMINI_API_KEY is not set"}), 500

    if not GEMINI_ENDPOINT_URL:
        return jsonify({"error": "GEMINI_ENDPOINT_URL is not set"}), 500

    user_id = data.get('user_id')
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Call Gemini API to get personalized investment strategy
    payload = {
        "financial_goal": user.financial_goal,
        "risk_tolerance": user.risk_tolerance,
        "investment_preference": user.investment_preference
    }
    
    # Sending a POST request to the Gemini API with the user's preferences
    try:
        response = requests.post(
            GEMINI_ENDPOINT_URL,
            json=payload,
            params={"key": GEMINI_API_KEY},
            timeout=30,
        )
        
        if response.status_code == 200:
            # Assuming the response contains the strategy
            investment_strategy = response.json()
            return jsonify({"investment_strategy": investment_strategy}), 200
        else:
            return jsonify({"error": "Failed to fetch investment strategy"}), 500

    except Exception as e:
        return jsonify({"error": f"Error fetching data from Gemini: {str(e)}"}), 500

# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True)