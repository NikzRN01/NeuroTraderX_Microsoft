import os

from flask import Flask, render_template, request, jsonify
import yfinance as yf
import numpy as np
import pandas as pd
import requests

app = Flask(__name__)

# OpenRouter API configuration
from dotenv import load_dotenv
load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

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

# AI-powered risk assessment using OpenRouter API
def openrouter_risk_assessment(portfolio_data):
    if not OPENROUTER_API_KEY:
        return {"error": "OPENROUTER_API_KEY environment variable is not set"}
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "openai/gpt-3.5-turbo",
        "messages": [
            {
                "role": "system",
                "content": "You are a professional investment risk analyst. Provide a concise risk assessment."
            },
            {
                "role": "user",
                "content": f"Analyze the risk profile of this portfolio: {portfolio_data}"
            }
        ],
        "max_tokens": 500
    }
    
    try:
        response = requests.post(OPENROUTER_URL, json=payload, headers=headers, timeout=30)
        if response.status_code == 200:
            result = response.json()
            assessment = result.get('choices', [{}])[0].get('message', {}).get('content', 'Unable to generate assessment')
            return {"assessment": assessment}
        else:
            return {"error": f"OpenRouter API error: {response.status_code}"}
    except Exception as e:
        return {"error": f"Risk assessment error: {str(e)}"}
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

    # Prepare data for OpenRouter API
    portfolio_data = {
        "tickers": tickers,
        "weights": weights.tolist(),
        "returns": mean_returns.tolist(),
        "risk": portfolio_stddev
    }

    # Get AI-powered risk assessment
    risk_assessment = openrouter_risk_assessment(portfolio_data)

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