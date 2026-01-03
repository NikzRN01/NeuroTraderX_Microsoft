from flask import Flask, render_template, request
import yfinance as yf
import pandas as pd
import requests
import matplotlib.pyplot as plt
import io
import base64
# import plotly.express as px

app = Flask(__name__)

# Gemini API configuration
GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"  # Replace with your Gemini API key
GEMINI_API_URL = "https://api.gemini.com/v1/insights"  # Replace with the actual Gemini API endpoint

# Function to categorize beta
def categorize_beta(beta):
    if beta == "N/A":
        return "N/A"
    beta = float(beta)
    if beta < 0.8:
        return "Moderately Low"
    elif 0.8 <= beta <= 1.2:
        return "Moderate"
    else:
        return "Moderately High"

# Function to format market cap
def format_market_cap(market_cap):
    if market_cap == "N/A":
        return "N/A"
    market_cap = float(market_cap)
    if market_cap >= 1e12:  # Trillions
        return f"${market_cap / 1e12:.2f}T"
    else:  # Billions
        return f"${market_cap / 1e9:.2f}B"

# Function to generate AI-based insights using Gemini API
def generate_ai_insights(symbol, prices):
    # Prepare the payload for the Gemini API
    payload = {
        "symbol": symbol,
        "prices": prices,
        "api_key": GEMINI_API_KEY
    }

    # Make a POST request to the Gemini API
    try:
        response = requests.post(GEMINI_API_URL, json=payload)
        response.raise_for_status()  # Raise an error for bad status codes
        insight = response.json().get("insight", "No insight generated.")
        return insight
    except requests.exceptions.RequestException as e:
        return f"Error generating insights: {e}"

# Function to fetch stock data
def get_stock_data(symbols, days):
    stock_data = {}
    for symbol in symbols:
        stock = yf.Ticker(symbol)
        hist = stock.history(period=f"{days}d")

        # Check if the DataFrame is empty
        if hist.empty:
            stock_data[symbol] = {"Error": f"No data found for {symbol} in the last {days} days."}
            continue

        info = stock.info  # Fetch additional info

        # Extract required metrics
        last_price = hist['Close'].iloc[-1]
        change_percentage = ((hist['Close'].iloc[-1] - hist['Close'].iloc[0]) / hist['Close'].iloc[0]) * 100
        volume = hist['Volume'].iloc[-1]
        day_range = f"{hist['Low'].iloc[-1]:.2f} - {hist['High'].iloc[-1]:.2f}"
        eight_week_range = f"{hist['Low'].min():.2f} - {hist['High'].max():.2f}"
        market_cap = format_market_cap(info.get("marketCap", "N/A"))
        beta = categorize_beta(info.get("beta", "N/A"))

        # Generate AI-based insights using Gemini API
        ai_insight = generate_ai_insights(symbol, hist['Close'].tolist()[-5:])

        stock_data[symbol] = {
            "Symbol": symbol,
            "Last Price": last_price,
            "Change Percentage": change_percentage,
            "Volume": volume,
            "Day Range": day_range,
            "8-Week Range": eight_week_range,
            "Market Cap": market_cap,
            "Beta": beta,
            "AI Insight": ai_insight  # Add AI-generated insight
        }
    return stock_data

# Function to generate actionable insights
def generate_actionable_insights(results):
    if not results:
        return "No data to generate insights."

    # Aggregate data
    total_stocks = len(results)
    upward_trends = sum(1 for r in results if r["Change Percentage"] > 0)
    downward_trends = total_stocks - upward_trends
    best_performer = max(results, key=lambda x: x["Change Percentage"])
    worst_performer = min(results, key=lambda x: x["Change Percentage"])
    avg_percentage_change = sum(r["Change Percentage"] for r in results) / total_stocks

    # Generate overall portfolio recommendation
    if upward_trends / total_stocks >= 0.7:
        portfolio_action = "Consider investing in the portfolio as most stocks are trending upward."
    elif downward_trends / total_stocks >= 0.7:
        portfolio_action = "Consider selling or avoiding the portfolio as most stocks are trending downward."
    else:
        portfolio_action = "Consider holding the portfolio as trends are mixed."

    # Format insights
    insights = {
        "Total Stocks Analyzed": total_stocks,
        "Upward Trends": f"{upward_trends} ({upward_trends / total_stocks * 100:.2f}%)",
        "Downward Trends": f"{downward_trends} ({downward_trends / total_stocks * 100:.2f}%)",
        "Best Performer": f"{best_performer['Symbol']} ({best_performer['Change Percentage']:.2f}%)",
        "Worst Performer": f"{worst_performer['Symbol']} ({worst_performer['Change Percentage']:.2f}%)",
        "Average Percentage Change": f"{avg_percentage_change:.2f}%",
        "Portfolio Recommendation": portfolio_action
    }
    return insights, pd.DataFrame(results)

# Function to generate stock price graph
def generate_stock_graph(symbols, days):
    plt.figure(figsize=(10, 6))
    for symbol in symbols:
        stock = yf.Ticker(symbol)
        hist = stock.history(period=f"{days}d")
        plt.plot(hist.index, hist['Close'], label=symbol)
    plt.title(f"Stock Price Trends (Last {days} Days)")
    plt.xlabel("Date")
    plt.ylabel("Price (USD)")
    plt.legend()
    plt.grid()
    # Save the plot to a BytesIO object
    buf = io.BytesIO()
    plt.savefig(buf, format="png")
    buf.seek(0)
    # Encode the image to base64
    image_base64 = base64.b64encode(buf.read()).decode("utf-8")
    plt.close()
    return image_base64

@app.route("/")
def home():
    return "Hello"
# Flask route for the home page
# @app.route("/", methods=["GET", "POST"])
# def home():
#     if request.method == "POST":
#         # Get user inputs
#         symbols_input = request.form.get("symbols")
#         intervals = request.form.getlist("intervals")

#         # Process inputs
#         symbols = [symbol.strip().upper() for symbol in symbols_input.split(",")] if symbols_input else []
#         intervals = [int(interval) for interval in intervals]

#         if not symbols:
#             return render_template("index.html", error="Please enter at least one stock symbol.")

#         # Fetch and analyze data
#         all_results = []
#         for days in intervals:
#             data = get_stock_data(symbols, days)
#             results = list(data.values())
#             all_results.extend(results)

#         # Generate actionable insights
#         insights, stock_insights_df = generate_actionable_insights(all_results)

#         # Generate stock price graph
#         graph_image = generate_stock_graph(symbols, intervals[0])

#         # Convert DataFrame to HTML for rendering
#         stock_insights_html = stock_insights_df.to_html(index=False)

#         return render_template("index.html", insights=insights, stock_insights_html=stock_insights_html, graph_image=graph_image)

#     return render_template("index.html")

# Run the Flask app
if __name__ == "__main__":
    app.run(debug=True)