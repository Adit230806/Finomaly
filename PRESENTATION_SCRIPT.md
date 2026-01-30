# Finomaly - 2 Minute Presentation Script

## [0:00-0:15] Problem & Solution
**"Finomaly detects fraudulent financial transactions in real-time using machine learning.**

**The Problem:** Banks process millions of transactions daily. Fraud detection is slow and generates false positives.

**Our Solution:** AI-powered anomaly detection that flags suspicious transactions instantly with a risk score."

---

## [0:15-0:45] Demo - Upload CSV
**"Let me show you how it works."**

1. Open browser → http://localhost:3000/anomaly-detection
2. Click "Upload CSV" 
3. Select `sample_transactions.csv`
4. Click "Analyze Transactions"

**"The system processes the entire batch in seconds..."**

---

## [0:45-1:15] Results Breakdown
**Point to the dashboard:**

1. **Risk Distribution Pie Chart**
   - "See how transactions are categorized: Safe (green), Medium (yellow), High (red)"

2. **Metrics Cards**
   - "Total transactions analyzed"
   - "Number of anomalies detected"
   - "Average risk score"

3. **Risk Scores Bar Chart**
   - "Each transaction gets a 0-100 risk score"

4. **Results Table**
   - "Scroll down to see individual transactions"
   - "Click on any anomaly to see why it was flagged"

---

## [1:15-1:45] Technical Highlights
**"Under the hood:"**

1. **ML Model:** Isolation Forest algorithm trained on 1000 transactions
2. **Features:** Amount Z-score, transaction frequency, statistical deviation
3. **Risk Scoring:** 
   - 0-50 = Safe (Green)
   - 51-70 = Medium Risk (Yellow)
   - 71-100 = High Risk (Red)

4. **Tech Stack:**
   - Frontend: React + Tailwind CSS
   - Backend: Flask + scikit-learn
   - Real-time processing with CORS-enabled API

---

## [1:45-2:00] Key Features & Next Steps
**"Key Features:"**
- ✅ Batch CSV processing
- ✅ Real-time anomaly detection
- ✅ Visual risk dashboard
- ✅ Dark mode support

**"Next Steps:"**
- Integrate with live banking APIs
- Add user authentication (Firebase ready)
- Deploy to production
- Retrain model with real transaction data

---

## Demo Checklist
- [ ] Flask running on port 5000
- [ ] React running on port 3000
- [ ] sample_transactions.csv ready
- [ ] Browser zoomed to 100%
- [ ] Dark mode toggle visible
- [ ] Network tab closed (cleaner UI)

## Timing Tips
- **Pause after each section** for questions
- **Hover over charts** to show tooltips
- **Scroll results table** to show more anomalies
- **Toggle dark mode** at the end to show UI polish
