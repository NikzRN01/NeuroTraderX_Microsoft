from flask import Flask, render_template, request
import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from prophet import Prophet  # For time series forecasting
import matplotlib.pyplot as plt
import io
import base64

app = Flask(__name__)

# Function to fetch historical stock data
def get_stock_data(symbol, days):
    stock = yf.Ticker(symbol)
    hist = stock.history(period=f"{days}d")
    return hist

# Function to predict future prices using Prophet
def predict_future_prices(hist, future_days):
    # Prepare data for Prophet
    df = hist[['Close']].reset_index()
    df.columns = ['ds', 'y']

    # Train Prophet model
    model = Prophet()
    model.fit(df)

    # Make future predictions
    future = model.make_future_dataframe(periods=future_days)
    forecast = model.predict(future)

    return forecast[['ds', 'yhat']].tail(future_days)

# Function to simulate investment scenarios
def simulate_investment(hist, initial_investment, future_prices):
    # Calculate daily returns
    hist['Daily Return'] = hist['Close'].pct_change()

    # Simulate future returns based on historical volatility
    simulated_returns = np.random.choice(hist['Daily Return'].dropna(), size=len(future_prices), replace=True)
    simulated_prices = [initial_investment]

    for ret in simulated_returns:
        simulated_prices.append(simulated_prices[-1] * (1 + ret))

    # Combine with predicted prices
    future_prices['Simulated Investment'] = simulated_prices[1:]

    return future_prices

# Function to plot results
def plot_results(hist, future_prices):
    plt.figure(figsize=(10, 6))
    plt.plot(hist['Close'], label='Historical Prices')
    plt.plot(future_prices['ds'], future_prices['yhat'], label='Predicted Prices', linestyle='--')
    plt.plot(future_prices['ds'], future_prices['Simulated Investment'], label='Simulated Investment', linestyle='-.')
    plt.title('Future Scenario Predictions')
    plt.xlabel('Date')
    plt.ylabel('Price')
    plt.legend()
    plt.grid()

    # Save plot to a BytesIO object
    img = io.BytesIO()
    plt.savefig(img, format='png')
    img.seek(0)
    plt.close()

    # Encode plot to base64 for HTML rendering
    plot_url = base64.b64encode(img.getvalue()).decode()
    return plot_url

# Flask route for the home page
@app.route("/")
def home():
    return "Hello"

# @app.route("/", methods=["GET", "POST"])
# def home():
#     if request.method == "POST":
#         # Get user inputs
#         symbol = request.form.get("symbol")
#         days = int(request.form.get("days"))
#         future_days = int(request.form.get("future_days"))
#         initial_investment = float(request.form.get("initial_investment"))

#         # Fetch historical data
#         hist = get_stock_data(symbol, days)

#         # Predict future prices
#         future_prices = predict_future_prices(hist, future_days)

#         # Simulate investment scenarios
#         future_prices = simulate_investment(hist, initial_investment, future_prices)

#         # Plot results
#         plot_url = plot_results(hist, future_prices)

#         # Prepare results for rendering
#         results = {
#             "symbol": symbol,
#             "initial_investment": initial_investment,
#             "future_days": future_days,
#             "plot_url": plot_url,
#             "future_prices": future_prices.to_dict('records')
#         }

#         return render_template("index.html", results=results)

#     return render_template("index.html")

# Run the Flask app
if __name__ == "__main__":
    app.run(debug=True)