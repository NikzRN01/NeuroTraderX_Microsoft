from flask import Flask, request, jsonify
from datetime import datetime
from flask_cors import CORS

my_app = Flask(__name__)
CORS(my_app)

def calculate_tax_liability(portfolio):
    short_term_gains = 0
    long_term_gains = 0
    stt_tax = 0
    ltcg_tax = 0

    if not portfolio:
        return {"error": "No portfolio data provided."}

    for asset in portfolio:
        asset_type = asset.get('type', '').lower()
        purchase_date = asset.get('purchase_date')
        purchase_price = asset.get('purchase_price', 0)
        current_price = asset.get('current_price', 0)
        quantity = asset.get('quantity', 0)

        if not purchase_date or not purchase_price or not current_price or not quantity:
            continue

        holding_period = (datetime.now() - datetime.strptime(purchase_date, "%Y-%m-%d")).days
        gain = (current_price - purchase_price) * quantity

        if asset_type in ['stock', 'mutual_fund', 'crypto', 'gold']:
            if holding_period <= 365:
                short_term_gains += gain
                stt_tax += gain * 0.15
            else:
                long_term_gains += gain
                ltcg_tax += gain * 0.10

    return {
        "short_term_gains": short_term_gains,
        "long_term_gains": long_term_gains,
        "stt_tax": stt_tax,
        "ltcg_tax": ltcg_tax,
        "total_tax": stt_tax + ltcg_tax
    }

@my_app.route('/api/submit_portfolio', methods=['POST'])
def submit_portfolio():
    data = request.json
    portfolio = data.get('portfolio', [])

    if not portfolio:
        return jsonify({"error": "No portfolio data provided."}), 400

    tax_summary = calculate_tax_liability(portfolio)
    return jsonify({"tax_summary": tax_summary})

if __name__ == '__main__':
    my_app.run(debug=True)