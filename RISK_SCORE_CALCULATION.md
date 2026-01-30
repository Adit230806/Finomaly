# Risk Score Calculation - Finomaly

## Overview

Finomaly uses a statistical Z-score based approach to calculate transaction risk scores. This document explains the methodology, formulas, and examples.

## Risk Score Formula

```
Risk Score = min(|Z-Score| × 25, 100)
```

## Step-by-Step Calculation Process

### Step 1: Calculate Z-Score (Statistical Deviation)

The Z-score measures how many standard deviations a transaction amount is from the mean:

```
Z-Score = (Transaction Amount - Mean Amount) / Standard Deviation
```

**Where:**
- **Transaction Amount**: The amount of the current transaction
- **Mean Amount**: Average of all transaction amounts in the batch
- **Standard Deviation**: Measure of spread in transaction amounts

### Step 2: Scale to 0-100 Range

Multiply the absolute Z-score by 25 to scale it to a 0-100 range:

```
Risk Score = |Z-Score| × 25
```

**Why multiply by 25?**
- A Z-score of 4 (4 standard deviations) = Risk Score of 100
- A Z-score of 2 (2 standard deviations) = Risk Score of 50
- A Z-score of 0 (at mean) = Risk Score of 0

### Step 3: Cap at Maximum

Ensure the risk score never exceeds 100:

```
Risk Score = min(Risk Score, 100)
```

## Risk Level Classification

Based on the calculated risk score:

| Risk Level | Score Range | Color | Meaning |
|-----------|------------|-------|---------|
| **Safe** | 0 - 50 | 🟢 Green | Normal transaction |
| **Medium** | 51 - 70 | 🟡 Yellow | Slightly unusual |
| **High** | 71 - 100 | 🔴 Red | Highly suspicious |

## Anomaly Detection Threshold

A transaction is flagged as an **anomaly** when:

```
|Z-Score| > 2.5
```

This means the transaction amount is more than 2.5 standard deviations away from the mean, which statistically occurs in less than 1.2% of normal cases.

## Practical Example

### Scenario
```
Transactions: ₹100, ₹105, ₹110, ₹115, ₹120, ₹5000

Step 1: Calculate Statistics
Mean = (100 + 105 + 110 + 115 + 120 + 5000) / 6 = ₹1108.33
Standard Deviation = ₹1963.5
```

### Example 1: Normal Transaction (₹100)

```
Z-Score = (100 - 1108.33) / 1963.5 = -0.51
Risk Score = min(|-0.51| × 25, 100) = min(12.75, 100) = 12.75
Risk Level = Safe ✓
Is Anomaly = No (|-0.51| < 2.5)
```

### Example 2: Unusual Transaction (₹5000)

```
Z-Score = (5000 - 1108.33) / 1963.5 = 1.98
Risk Score = min(|1.98| × 25, 100) = min(49.5, 100) = 49.5
Risk Level = Safe ✓
Is Anomaly = No (|1.98| < 2.5)
```

### Example 3: Extreme Transaction (₹10000)

```
Z-Score = (10000 - 1108.33) / 1963.5 = 4.53
Risk Score = min(|4.53| × 25, 100) = min(113.25, 100) = 100
Risk Level = High 🔴
Is Anomaly = Yes (|4.53| > 2.5)
```

## Key Characteristics

### Advantages

✅ **Statistical Foundation**: Based on proven statistical methods
✅ **Adaptive**: Adjusts to different transaction patterns
✅ **Interpretable**: Easy to understand and explain
✅ **Scalable**: Works with any transaction volume
✅ **Real-time**: Calculates instantly

### How It Works

1. **Detects Outliers**: Identifies transactions far from normal patterns
2. **Bidirectional**: Catches both unusually high and low amounts
3. **Normalized**: Accounts for different transaction scales
4. **Contextual**: Compares against actual transaction history

## Implementation Details

### Backend Calculation (Flask)

```python
# Calculate statistics
mean = np.mean(amounts)
std = np.std(amounts)
if std == 0:
    std = 1.0

# For each transaction
z_score = (amount - mean) / std
z_score = min(max(z_score, -5), 5)  # Clamp to [-5, 5]

# Calculate risk score
is_anomaly = abs(z_score) > 2.5
risk_score = min(abs(z_score) * 25, 100)

# Determine risk level
if risk_score > 70:
    risk_level = "High"
elif risk_score > 50:
    risk_level = "Medium"
else:
    risk_level = "Safe"
```

## Use Cases

### Case 1: Fraud Detection
- High-value transactions from new accounts
- Transactions at unusual times
- Multiple transactions in short periods

### Case 2: Anomaly Monitoring
- Sudden spending pattern changes
- Transactions in new locations
- Unusual transaction frequencies

### Case 3: Risk Assessment
- Portfolio risk evaluation
- Customer behavior analysis
- Transaction pattern monitoring

## Limitations & Considerations

⚠️ **Limitations:**
- Assumes normal distribution of transactions
- May flag legitimate large transactions
- Requires sufficient transaction history
- Doesn't account for seasonal patterns

✅ **Best Practices:**
- Use with domain expertise
- Combine with other fraud signals
- Regularly review flagged transactions
- Adjust thresholds based on business needs

## Customization

### Adjust Anomaly Threshold

To make detection stricter or looser:

```python
# Stricter (fewer false positives)
is_anomaly = abs(z_score) > 3.0

# Looser (catch more anomalies)
is_anomaly = abs(z_score) > 2.0
```

### Adjust Risk Score Scaling

To change the 0-100 scale:

```python
# More sensitive
risk_score = min(abs(z_score) * 30, 100)

# Less sensitive
risk_score = min(abs(z_score) * 20, 100)
```

### Adjust Risk Level Boundaries

```python
if risk_score > 80:
    risk_level = "Critical"
elif risk_score > 60:
    risk_level = "High"
elif risk_score > 40:
    risk_level = "Medium"
else:
    risk_level = "Safe"
```

## References

- **Z-Score**: Statistical measure of deviation from mean
- **Standard Deviation**: Measure of data spread
- **Normal Distribution**: Bell curve assumption
- **Anomaly Detection**: Identifying unusual patterns

## Support

For questions or improvements to the risk calculation methodology, please refer to the main README.md or contact the development team.
