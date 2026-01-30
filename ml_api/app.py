from flask import Flask, request, jsonify
import numpy as np
import sys

app = Flask(__name__)

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "OK"})

@app.route("/api/analyze-batch", methods=["POST"])
def analyze_batch():
    try:
        # Get JSON safely
        data = request.get_json(silent=True)
        if data is None:
            return jsonify({"error": "Invalid JSON"}), 400
        
        # Get transactions array
        transactions = data.get("transactions")
        if transactions is None:
            return jsonify({"error": "Missing 'transactions' field"}), 400
        
        if not isinstance(transactions, list):
            return jsonify({"error": "'transactions' must be an array"}), 400
        
        if len(transactions) == 0:
            return jsonify({"error": "transactions array is empty"}), 400
        
        # Extract and validate amounts
        amounts = []
        for tx in transactions:
            try:
                amt = float(tx.get("amount", 0))
                amounts.append(amt)
            except (ValueError, TypeError):
                amounts.append(0)
        
        # Calculate statistics
        mean = float(np.mean(amounts))
        std = float(np.std(amounts))
        if std == 0:
            std = 1.0
        
        # Analyze each transaction
        results = []
        for tx in transactions:
            try:
                amount = float(tx.get("amount", 0))
                z_score = (amount - mean) / std
                z_score = float(z_score)
                
                is_anomaly = abs(z_score) > 2.5
                risk_score = min(abs(z_score) * 25, 100)
                risk_score = float(risk_score)
                
                if risk_score > 70:
                    risk_level = "High"
                elif risk_score > 50:
                    risk_level = "Medium"
                else:
                    risk_level = "Safe"
                
                results.append({
                    "transactionId": str(tx.get("id", "")),
                    "account": str(tx.get("account", "Unknown")),
                    "amount": float(amount),
                    "riskScore": round(risk_score, 2),
                    "riskLevel": risk_level,
                    "isAnomaly": bool(is_anomaly),
                    "z_score": round(z_score, 3),
                    "reasons": [f"Z-score: {z_score:.2f}"] if is_anomaly else []
                })
            except Exception as e:
                print(f"Error processing transaction: {e}", file=sys.stderr)
                continue
        
        return jsonify({"results": results})
    
    except Exception as e:
        print(f"Error in analyze_batch: {e}", file=sys.stderr)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
