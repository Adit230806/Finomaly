import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { AMOUNT_INPUT_LABEL } from "@/lib/currency";
import { MAHARASHTRA_LOCATIONS } from "@/lib/locations";
import { useTransactions } from "@/hooks/use-transactions";
import type { Category, PaymentMethod } from "@/types/transaction";
import { TRUSTED_RISK_THRESHOLD } from "@/types/behavior";
import { buildBehaviorProfile } from "@/utils/userBehaviorProfile";
import type { TransactionAnalysisResult } from "@/utils/anomalyDetection";
import { formatINR } from "@/lib/currency";

const MERCHANTS = [
  "Amazon",
  "Starbucks",
  "Apple",
  "Uber",
  "Whole Foods",
  "Netflix",
  "Steam",
  "Binance",
  "Unknown Vendor",
];
const LOCATIONS = [...MAHARASHTRA_LOCATIONS];
const CATEGORIES: Category[] = [
  "Shopping",
  "Food",
  "Entertainment",
  "Transfer",
  "ATM",
  "Travel",
];
const PAYMENT_METHODS: PaymentMethod[] = [
  "UPI",
  "Card",
  "Debit Card",
  "Credit Card",
  "Bank Transfer",
  "NEFT",
  "IMPS",
  "Wallet",
  "Apple Pay",
  "Google Pay",
  "PayPal",
  "Crypto",
];

export function TransactionSimulator() {
  const { transactions, addTransaction } = useTransactions();

  const [merchant, setMerchant] = useState(MERCHANTS[0]);
  const [amount, setAmount] = useState("125.00");
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [method, setMethod] = useState<PaymentMethod>(PAYMENT_METHODS[0]);
  const [simLoading, setSimLoading] = useState(false);
  const [result, setResult] = useState<TransactionAnalysisResult | null>(null);

  const behaviorProfile = useMemo(() => {
    const trusted = transactions
      .filter((t) => t.riskScore < TRUSTED_RISK_THRESHOLD)
      .map((t) => ({
        amount: t.amount,
        location: t.location,
        type: t.paymentMethod,
      }));
    return buildBehaviorProfile(trusted);
  }, [transactions]);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimLoading(true);
    setResult(null);

    try {
      const saved = await addTransaction({
        merchant,
        amount: Number(amount),
        location,
        category,
        paymentMethod: method,
      });

      const contributes = saved.riskScore < TRUSTED_RISK_THRESHOLD;

      setResult({
        risk_score: saved.riskScore,
        status:
          saved.status === "Anomaly"
            ? "Anomalous"
            : (saved.status as TransactionAnalysisResult["status"]),
        reasons: saved.explanation,
        confidence:
          (saved.confidenceLabel as TransactionAnalysisResult["confidence"]) ??
          (saved.riskScore >= 60
            ? "High Risk"
            : saved.riskScore >= 30
              ? "Medium Risk"
              : "Low Risk"),
        contributesToProfile: contributes,
      });

      toast.success(
        saved.isAnomaly
          ? "Anomalous — flagged, not added to trusted baseline"
          : saved.status === "Suspicious"
            ? "Suspicious — flagged, not added to trusted baseline"
            : "Normal — saved and included in behavioral learning",
      );
    } catch {
      toast.error("Could not save transaction.");
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl border border-[#E8E6E0] p-6"
        style={{ boxShadow: "0 2px 24px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="h-9 w-9 rounded-xl bg-[#E8F9EF] flex items-center justify-center">
            <Zap size={18} className="text-[#00C853]" />
          </div>
          <div>
            <h2 className="font-semibold text-[#0A0A0A]">New Transaction</h2>
            <p className="text-xs text-[#6B6B6B]">
              Compared to trusted history only (score &lt; {TRUSTED_RISK_THRESHOLD})
            </p>
          </div>
        </div>

        {behaviorProfile.normalTransactionCount > 0 ? (
          <div className="mb-4 rounded-xl bg-[#F8F7F4] border border-[#E8E6E0] px-3 py-2.5 text-xs text-[#6B6B6B]">
            Trusted baseline: {behaviorProfile.normalTransactionCount} transactions · avg{" "}
            {formatINR(behaviorProfile.averageAmount, 0)} · median{" "}
            {formatINR(behaviorProfile.medianAmount, 0)} · home{" "}
            {behaviorProfile.primaryHomeLocation.split(",")[0]}
          </div>
        ) : (
          <div className="mb-4 rounded-xl bg-[#FFF4E5] border border-[#FFD9A0] px-3 py-2.5 text-xs text-[#CC7700]">
            No trusted history yet — first normal transactions build your baseline.
          </div>
        )}

        <form onSubmit={handleSimulate} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#6B6B6B] mb-1.5 block">Merchant</label>
            <select
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full h-11 rounded-xl border border-[#E8E6E0] px-3 text-sm outline-none focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 bg-white transition-all"
            >
              {MERCHANTS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-[#6B6B6B] mb-1.5 block">
              {AMOUNT_INPUT_LABEL}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full h-11 rounded-xl border border-[#E8E6E0] px-3 text-sm outline-none focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#6B6B6B] mb-1.5 block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full h-11 rounded-xl border border-[#E8E6E0] px-3 text-sm outline-none focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 bg-white transition-all"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#6B6B6B] mb-1.5 block">Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full h-11 rounded-xl border border-[#E8E6E0] px-3 text-sm outline-none focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 bg-white transition-all"
              >
                {LOCATIONS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B6B] mb-1.5 block">Payment method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full h-11 rounded-xl border border-[#E8E6E0] px-3 text-sm outline-none focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 bg-white transition-all"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={simLoading}
            className="w-full h-12 rounded-xl bg-[#00C853] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#00B347] disabled:opacity-60 transition-all shadow-lg shadow-[#00C853]/25"
          >
            <Sparkles size={16} />
            {simLoading ? "Analyzing…" : "Analyze Transaction"}
          </button>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className={`rounded-3xl border p-6 flex flex-col min-h-[320px] ${
          result
            ? result.status === "Anomalous"
              ? "bg-[#0b0b0b] border-[#333] text-white"
              : result.status === "Suspicious"
                ? "bg-[#FFF4E5] border-[#FFD9A0]"
                : "bg-white/80 backdrop-blur-xl border-[#E8E6E0]"
            : "bg-[#F8F7F4]/80 backdrop-blur-xl border-dashed border-[#E8E6E0]"
        }`}
        style={{ boxShadow: result ? "0 2px 24px rgba(0,0,0,0.08)" : undefined }}
      >
        {!result ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="h-14 w-14 rounded-2xl bg-[#E8F9EF] flex items-center justify-center mb-4">
              <Sparkles size={24} className="text-[#00C853]" />
            </div>
            <p className="font-medium text-[#0A0A0A] mb-1">Prediction Result</p>
            <p className="text-xs text-[#6B6B6B] max-w-[220px]">
              Submit a transaction to see risk score and explainable reasons
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    result.status === "Anomalous"
                      ? "text-[#FF3B30]"
                      : result.status === "Suspicious"
                        ? "text-[#CC7700]"
                        : "text-[#00C853]"
                  }`}
                >
                  {result.status}
                </span>
                <p
                  className={`text-xs mt-1 ${
                    result.status === "Anomalous" ? "text-white/50" : "text-[#6B6B6B]"
                  }`}
                >
                  {result.confidence}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`text-4xl font-bold tabular-nums ${
                    result.status === "Anomalous" ? "text-white" : "text-[#0A0A0A]"
                  }`}
                >
                  {result.risk_score}
                </span>
                <span
                  className={`text-sm ${
                    result.status === "Anomalous" ? "text-white/40" : "text-[#6B6B6B]"
                  }`}
                >
                  /100
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto">
              <p
                className={`text-xs font-medium mb-2 ${
                  result.status === "Anomalous" ? "text-white/60" : "text-[#6B6B6B]"
                }`}
              >
                {result.reasons.length ? "Why flagged?" : "No risk signals"}
              </p>
              {result.contributesToProfile ? (
                <p className="text-xs text-[#00A844] mb-2 font-medium">
                  ✓ Will update trusted behavioral profile
                </p>
              ) : (
                <p className="text-xs text-[#FF9500] mb-2 font-medium">
                  ✗ Excluded from averages &amp; learning
                </p>
              )}
              <ul className="space-y-2">
                {(result.reasons.length ? result.reasons : ["No risk signals detected"]).map(
                  (r, i) => (
                  <li
                    key={i}
                    className={`text-xs rounded-xl px-3 py-2.5 leading-relaxed list-none flex gap-2 before:content-['•'] before:font-bold ${
                      result.status === "Anomalous"
                        ? "bg-white/10 text-white/90 before:text-[#FF3B30]"
                        : result.status === "Suspicious"
                          ? "bg-white/60 text-[#0A0A0A] before:text-[#FF9500]"
                          : "bg-[#F0EFEA] text-[#0A0A0A] before:text-[#00C853]"
                    }`}
                  >
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
