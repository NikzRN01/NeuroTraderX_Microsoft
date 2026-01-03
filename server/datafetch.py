from flask import Flask, render_template, request, jsonify
import yfinance as yf
# import ccxt
import pandas as pd
import requests

app = Flask(__name__)

# Gemini API configuration
GEMINI_API_KEY = "your_gemini_api_key"
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
# @app.route("/")
# def index():
#     return render_template("index.html")

# @app.route("/fetch_data", methods=["POST"])
# def fetch_data():
#     market_type = request.form.get("market_type")
#     symbol = request.form.get("symbol")
#     exchange = request.form.get("exchange", "NSE")

#     if market_type == "stock":
#         data = fetch_stock_data(symbol, exchange)
#         if data is None:
#             return jsonify({"error": "Invalid symbol or exchange."})
#         latest_data = {
#             "symbol": symbol,
#             "exchange": exchange,
#             "last_price": data['Close'].iloc[-1],
#             "change": data['Close'].iloc[-1] - data['Open'].iloc[0],
#             "volume": data['Volume'].iloc[-1]
#         }
#     elif market_type == "crypto":
#         data = fetch_crypto_data(symbol)
#         latest_data = {
#             "symbol": symbol,
#             "last_price": data["last"],
#             "change": data["last"] - data["open"],
#             "volume": data["quoteVolume"]
#         }
#     elif market_type == "commodity":
#         data = fetch_commodity_data(symbol)
#         latest_data = {
#             "symbol": symbol,
#             "last_price": data['Close'].iloc[-1],
#             "change": data['Close'].iloc[-1] - data['Open'].iloc[0],
#             "volume": data['Volume'].iloc[-1]
#         }
#     else:
#         return jsonify({"error": "Invalid market type."})

#     # Generate AI-based insights
#     ai_insight = generate_ai_insights(latest_data)

#     # Return results
#     results = {
#         "market_type": market_type,
#         "symbol": symbol,
#         "data": latest_data,
#         "ai_insight": ai_insight
#     }
#     return jsonify(results)

if __name__ == "__main__":
    app.run(debug=True)