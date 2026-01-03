from flask import Flask, render_template, request, jsonify
import yfinance as yf
import numpy as np
import pandas as pd
from scipy.stats import norm
import requests

app = Flask(__name__)

# Gemini API Key
GEMINI_API_KEY = "AIzaSyBba1JDsIFCYeuKXnne4QmllDRvGe64iJ4"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0"  # Example endpoint

# Fetch stock data using yfinance
def fetch_stock_data(tickers, start_date, end_date):
    data = yf.download(tickers, start=start_date, end=end_date)['Adj Close']
    return data

# Calculate portfolio metrics
def calculate_metrics(data):
    returns = data.pct_change().dropna()
    mean_returns = returns.mean()
    cov_matrix = returns.cov()
    return mean_returns, cov_matrix

# Optimize portfolio using Markowitz Modern Portfolio Theory
def optimize_portfolio(mean_returns, cov_matrix, risk_free_rate=0.02):
    num_assets = len(mean_returns)
    weights = np.random.random(num_assets)
    weights /= np.sum(weights)

    portfolio_return = np.sum(weights * mean_returns) * 252
    portfolio_stddev = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights))) * np.sqrt(252)
    sharpe_ratio = (portfolio_return - risk_free_rate) / portfolio_stddev

    return weights, portfolio_return, portfolio_stddev, sharpe_ratio

# AI-powered risk assessment using Gemini API
def gemini_risk_assessment(portfolio_data):
    headers = {"Authorization": f"Bearer {GEMINI_API_KEY}"}
    response = requests.post(GEMINI_URL, json=portfolio_data, headers=headers)
    return response.json()


# @app.route("/")
# def home():
#     return "Hello"
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/analyze", methods=["POST"])
def analyze():
    # Get user input
    tickers = request.form.get("tickers").split(",")
    start_date = request.form.get("start_date")
    end_date = request.form.get("end_date")

    # Fetch stock data
    stock_data = fetch_stock_data(tickers, start_date, end_date)

    # Calculate portfolio metrics
    mean_returns, cov_matrix = calculate_metrics(stock_data)
    weights, portfolio_return, portfolio_stddev, sharpe_ratio = optimize_portfolio(mean_returns, cov_matrix)

    # Prepare data for Gemini API
    portfolio_data = {
        "tickers": tickers,
        "weights": weights.tolist(),
        "returns": mean_returns.tolist(),
        "risk": portfolio_stddev
    }

    # Get AI-powered risk assessment
    risk_assessment = gemini_risk_assessment(portfolio_data)

    # Return results
    results = {
        "weights": weights.tolist(),
        "portfolio_return": portfolio_return,
        "portfolio_risk": portfolio_stddev,
        "sharpe_ratio": sharpe_ratio,
        "risk_assessment": risk_assessment
    }
    return jsonify(results)

if __name__ == "__main__":
    app.run(debug=True)