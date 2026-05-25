import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminRoute } from "@/components/AdminRoute";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SkeletonRow } from "@/components/shared/SkeletonCard";
import { ExplainabilityDrawer } from "@/components/shared/ExplainabilityDrawer";
import { useTransactions } from "@/hooks/use-transactions";
import type { Transaction, Category, PaymentMethod, CreateTransactionInput } from "@/types/transaction";
import { format } from "date-fns";
import { Search, ChevronUp, ChevronDown, Download, SlidersHorizontal, X, Plus } from "lucide-react";
import { useEffect } from "react";
import { formatINR, AMOUNT_INPUT_LABEL } from "@/lib/currency";
import { MAHARASHTRA_LOCATIONS } from "@/lib/locations";

export const Route = createFileRoute("/transactions")({ component: TransactionsPage });

type SortKey = keyof Pick<Transaction, "timestamp" | "amount" | "riskScore" | "merchant">;
type SortDir = "asc" | "desc";

const CATEGORIES: Category[]      = ["Shopping","Food","Entertainment","Transfer","ATM","Travel"];
const METHODS: PaymentMethod[] = [
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
const PAGE_SIZES = [10, 25, 50];

function TransactionsPage() {
  const [ready,    setReady]    = useState(false);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [search,   setSearch]   = useState("");
  const [sortKey,  setSortKey]  = useState<SortKey>("timestamp");
  const [sortDir,  setSortDir]  = useState<SortDir>("desc");
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  const { transactions, loading: txLoading, addTransaction, reviewTransaction } =
    useTransactions();

  const [showAddModal, setShowAddModal] = useState(false);

  // Filters
  const [riskLevels,  setRiskLevels]  = useState<string[]>([]);
  const [statuses,    setStatuses]    = useState<string[]>([]);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [methods,     setMethods]     = useState<PaymentMethod[]>([]);
  const [minAmt,      setMinAmt]      = useState("");
  const [maxAmt,      setMaxAmt]      = useState("");

  useEffect(() => {
    if (!txLoading) { const t = setTimeout(() => setReady(true), 400); return () => clearTimeout(t); }
  }, [txLoading]);

  const filtered = useMemo(() => {
    let rows = [...transactions];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((t) => t.merchant.toLowerCase().includes(q) || t.location.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }
    if (riskLevels.length) {
      rows = rows.filter((t) => {
        const lvl = t.riskScore <= 30 ? "low" : t.riskScore <= 70 ? "medium" : "high";
        return riskLevels.includes(lvl);
      });
    }
    if (statuses.length) {
      rows = rows.filter((t) => {
        const label = t.status === "Anomaly" ? "Anomalous" : t.status;
        return statuses.includes(t.status) || statuses.includes(label);
      });
    }
    if (categories.length) rows = rows.filter((t) => categories.includes(t.category));
    if (methods.length)    rows = rows.filter((t) => methods.includes(t.paymentMethod));
    if (minAmt) rows = rows.filter((t) => t.amount >= Number(minAmt));
    if (maxAmt) rows = rows.filter((t) => t.amount <= Number(maxAmt));

    rows.sort((a, b) => {
      let av: number | string = a[sortKey] as number | string;
      let bv: number | string = b[sortKey] as number | string;
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [transactions, search, riskLevels, statuses, categories, methods, minAmt, maxAmt, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
    setPage(1);
  };

  const toggleArr = <T,>(arr: T[], val: T, set: (v: T[]) => void) => {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
    setPage(1);
  };

  const clearFilters = () => { setRiskLevels([]); setStatuses([]); setCategories([]); setMethods([]); setMinAmt(""); setMaxAmt(""); setSearch(""); setPage(1); };

  const SortIcon = ({ k }: { k: SortKey }) => sortKey === k
    ? (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
    : <ChevronDown size={12} className="opacity-30" />;

  const exportCSV = () => {
    const header = "ID,Merchant,Category,Amount,Location,Method,Risk,Status,Time\n";
    const rows = filtered.map((t) => `${t.id},${t.merchant},${t.category},${t.amount},${t.location},${t.paymentMethod},${t.riskScore},${t.status},${t.timestamp}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "transactions.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminRoute>
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0A0A]">Transactions</h1>
          <p className="text-[#6B6B6B] text-sm mt-1">Monitor and analyze all transactions</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#E8F9EF] text-[#00A844]">{filtered.length} records</span>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[#00C853] text-white text-sm font-medium hover:bg-[#00B347] transition-colors">
            <Plus size={14} /> Add Transaction
          </button>
          <button onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-2 h-9 px-4 rounded-xl border border-[#E8E6E0] bg-white text-sm font-medium hover:bg-[#F8F7F4] transition-colors">
            <SlidersHorizontal size={14} /> Filters
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-2 h-9 px-4 rounded-xl border border-[#E8E6E0] bg-white text-sm font-medium hover:bg-[#F8F7F4] transition-colors">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-5">
        {/* Filter sidebar */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="w-full lg:w-[260px] flex-shrink-0 bg-white rounded-2xl border border-[#E8E6E0] p-4 sm:p-5 h-fit lg:sticky lg:top-24 overflow-hidden"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-sm text-[#0A0A0A]">Filters</span>
                <button onClick={() => setShowFilters(false)} className="text-[#6B6B6B] hover:text-[#0A0A0A]"><X size={14} /></button>
              </div>

              {/* Search */}
              <div className="mb-4">
                <label className="text-xs font-medium text-[#6B6B6B] mb-1.5 block">Search</label>
                <div className="relative">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
                  <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Merchant, location..."
                    className="w-full h-9 pl-8 pr-3 rounded-xl border border-[#E8E6E0] text-xs outline-none focus:border-[#00C853]" />
                </div>
              </div>

              {/* Risk level */}
              <FilterSection label="Risk Level">
                {[["low","#00C853"],["medium","#FF9500"],["high","#FF3B30"]].map(([lvl, color]) => (
                  <CheckItem key={lvl} label={lvl} color={color} checked={riskLevels.includes(lvl)}
                    onChange={() => toggleArr(riskLevels, lvl, setRiskLevels)} />
                ))}
              </FilterSection>

              {/* Status */}
              <FilterSection label="Status">
                {["Normal", "Suspicious", "Anomalous", "Anomaly"].map((s) => (
                  <CheckItem key={s} label={s} checked={statuses.includes(s)} onChange={() => toggleArr(statuses, s, setStatuses)} />
                ))}
              </FilterSection>

              {/* Category */}
              <FilterSection label="Category">
                {CATEGORIES.map((c) => (
                  <CheckItem key={c} label={c} checked={categories.includes(c)} onChange={() => toggleArr(categories, c, setCategories)} />
                ))}
              </FilterSection>

              {/* Amount range */}
              <FilterSection label="Amount Range">
                <div className="flex gap-2">
                  <input value={minAmt} onChange={(e) => { setMinAmt(e.target.value); setPage(1); }} placeholder="Min"
                    className="w-full h-8 px-2 rounded-lg border border-[#E8E6E0] text-xs outline-none focus:border-[#00C853]" />
                  <input value={maxAmt} onChange={(e) => { setMaxAmt(e.target.value); setPage(1); }} placeholder="Max"
                    className="w-full h-8 px-2 rounded-lg border border-[#E8E6E0] text-xs outline-none focus:border-[#00C853]" />
                </div>
              </FilterSection>

              <button onClick={clearFilters} className="w-full mt-2 text-xs text-[#6B6B6B] hover:text-[#FF3B30] transition-colors">Clear all</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-[#E8E6E0] overflow-hidden" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E6E0] bg-[#F8F7F4]">
                    {[["#",""],["Time","timestamp"],["Merchant","merchant"],["Category",""],["Location",""],["Amount","amount"],["Method",""],["Risk","riskScore"],["Status",""],["Actions",""]].map(([label, key]) => (
                      <th key={String(label)} onClick={() => key ? toggleSort(key as SortKey) : undefined}
                        className={`px-4 py-3 text-left text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide whitespace-nowrap ${key ? "cursor-pointer hover:text-[#0A0A0A] select-none" : ""}`}>
                        <span className="flex items-center gap-1">{label}{key && <SortIcon k={key as SortKey} />}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!ready ? (
                    Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : paged.length === 0 ? (
                    <tr><td colSpan={10} className="text-center py-16 text-[#6B6B6B] text-sm">No transactions match your filters.</td></tr>
                  ) : (
                    paged.map((tx, i) => (
                      <motion.tr key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                        onClick={() => setSelected(tx)}
                        className="border-b border-[#F0EFEA] last:border-0 hover:bg-[#F8F7F4] cursor-pointer transition-colors">
                        <td className="px-4 py-3 text-xs text-[#6B6B6B]">{(page - 1) * pageSize + i + 1}</td>
                        <td className="px-4 py-3 text-xs text-[#6B6B6B] whitespace-nowrap">{format(new Date(tx.timestamp), "MMM d, HH:mm")}</td>
                        <td className="px-4 py-3 font-medium text-[#0A0A0A] whitespace-nowrap">{tx.merchant}</td>
                        <td className="px-4 py-3 text-xs text-[#6B6B6B]">{tx.category}</td>
                        <td className="px-4 py-3 text-xs text-[#6B6B6B]">{tx.location}</td>
                        <td className="px-4 py-3 font-bold text-[#0A0A0A] text-right tabular-nums">{formatINR(tx.amount)}</td>
                        <td className="px-4 py-3 text-xs text-[#6B6B6B]">{tx.paymentMethod}</td>
                        <td className="px-4 py-3"><RiskBadge score={tx.riskScore} size="sm" /></td>
                        <td className="px-4 py-3"><StatusBadge status={tx.status} size="sm" /></td>
                        <td className="px-4 py-3">
                          <button onClick={(e) => { e.stopPropagation(); setSelected(tx); }}
                            className="px-3 py-1 rounded-lg border border-[#E8E6E0] text-xs font-medium hover:bg-[#F0EFEA] transition-colors whitespace-nowrap">
                            View Details
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8E6E0] bg-[#F8F7F4]">
              <span className="text-xs text-[#6B6B6B]">
                Showing {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="h-7 px-2 rounded-lg border border-[#E8E6E0] text-xs outline-none bg-white">
                  {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} / page</option>)}
                </select>
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                  className="h-7 px-3 rounded-lg border border-[#E8E6E0] text-xs font-medium disabled:opacity-40 hover:bg-white transition-colors">
                  Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`h-7 w-7 rounded-lg text-xs font-medium transition-colors ${page === p ? "bg-[#0A0A0A] text-white" : "border border-[#E8E6E0] hover:bg-white"}`}>
                      {p}
                    </button>
                  );
                })}
                <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                  className="h-7 px-3 rounded-lg border border-[#E8E6E0] text-xs font-medium disabled:opacity-40 hover:bg-white transition-colors">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ExplainabilityDrawer
        transaction={selected}
        onClose={() => setSelected(null)}
        onReview={reviewTransaction}
        onReviewed={setSelected}
      />
      {showAddModal && (
        <AddTransactionModal
          onClose={() => setShowAddModal(false)}
          onAdd={async (tx) => { await addTransaction(tx); setShowAddModal(false); }}
        />
      )}
    </AppLayout>
    </AdminRoute>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-[#0A0A0A] mb-2">{label}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function CheckItem({ label, color, checked, onChange }: { label: string; color?: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input type="checkbox" checked={checked} onChange={onChange} className="rounded accent-[#00C853]" />
      {color && <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: color }} />}
      <span className="text-xs text-[#6B6B6B] group-hover:text-[#0A0A0A] capitalize transition-colors">{label}</span>
    </label>
  );
}

// ── Add Transaction Modal ─────────────────────────────────────────────────────

const FIELD_CLS = "w-full h-10 rounded-xl border border-[#E8E6E0] px-3 text-sm outline-none focus:border-[#00C853] bg-white";

function AddTransactionModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (input: CreateTransactionInput) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    merchant:      "",
    amount:        "",
    location:      MAHARASHTRA_LOCATIONS[0],
    category:      "Shopping" as Category,
    paymentMethod: "Card" as PaymentMethod,
  });

  const set = (k: string, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onAdd({
      merchant:      form.merchant,
      amount:        parseFloat(form.amount),
      location:      form.location,
      category:      form.category,
      paymentMethod: form.paymentMethod,
    });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#0A0A0A]">Add Transaction</h2>
          <button onClick={onClose} className="text-[#6B6B6B] hover:text-[#0A0A0A]"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#333] mb-1 block">Merchant *</label>
              <input required value={form.merchant} onChange={(e) => set("merchant", e.target.value)}
                placeholder="Amazon" className={FIELD_CLS} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#333] mb-1 block">{AMOUNT_INPUT_LABEL} *</label>
              <input required type="number" min="0" step="0.01" value={form.amount}
                onChange={(e) => set("amount", e.target.value)} placeholder="2500" className={FIELD_CLS} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#333] mb-1 block">Location *</label>
            <select
              required
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              className={FIELD_CLS}
            >
              {MAHARASHTRA_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#333] mb-1 block">Category</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className={FIELD_CLS}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#333] mb-1 block">Payment Method</label>
              <select value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)} className={FIELD_CLS}>
                {METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <p className="text-xs text-[#6B6B6B] bg-[#F8F7F4] rounded-xl px-3 py-2">
            Risk score, confidence, and reasons are computed automatically by the fraud engine.
          </p>

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-[#E8E6E0] text-sm font-medium hover:bg-[#F8F7F4] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 h-10 rounded-xl bg-[#00C853] text-white text-sm font-semibold hover:bg-[#00B347] disabled:opacity-60 transition-colors">
              {submitting ? "Saving…" : "Add Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
