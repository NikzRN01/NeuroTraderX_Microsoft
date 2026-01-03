from flask import Flask, render_template, request, jsonify
import yfinance as yf
# import ccxt
import pandas as pd
import requests

app = Flask(__name__)

# Gemini API configuration
import os

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://api.gemini.com/v1/insights"  # Example endpoint

# Function to fetch NSE/BSE stock data
def fetch_stock_data(symbol, exchange="NSE"):
    if exchange == "NSE":
        symbol += ".NS"  # NSE ticker suffix
    elif exchange == "BSE":
        symbol += ".BO"  # BSE ticker suffix
    stock = yf.Ticker(symbol)
    data = stock.history(period="1d")
    if data.empty:
        return None
    return data

# Function to fetch cryptocurrency data
def fetch_crypto_data(symbol):
    exchange = ccxt.binance()
    ticker = symbol + "/USDT"  # Fetch against USDT
    data = exchange.fetch_ticker(ticker)
    return data

# Function to fetch commodity data
def fetch_commodity_data(ticker):
    commodity = yf.Ticker(ticker)
    data = commodity.history(period="1d")
    return data

# Function to generate AI-based insights using Gemini API
def generate_ai_insights(data):
    if not GEMINI_API_KEY:
        return "Error generating insights: GEMINI_API_KEY environment variable is not set"
    headers = {"Authorization": f"Bearer {GEMINI_API_KEY}"}
    payload = {"data": data}
    try:
        response = requests.post(GEMINI_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        return response.json().get("insight", "No insight generated.")
    except requests.exceptions.RequestException as e:
        return f"Error generating insights: {e}"



@app.route("/")
def home():
    return "Hello"

if __name__ == "__main__":
    app.run(debug=True)