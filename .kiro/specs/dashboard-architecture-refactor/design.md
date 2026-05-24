# Design Document

## Overview

This is a pure frontend refactor of two existing route files:
- `src/routes/user-dashboard.tsx` — stripped down to simulation-only
- `src/routes/admin-dashboard.tsx` — expanded to full analytics hub

No new routes, hooks, services, or Supabase integrations are introduced. All existing shared components (`ChartCard`, `StatCard`, `RiskBadge`, `ExplainabilityDrawer`, `AppLayout`, `ProtectedRoute`) are reused as-is.

## Architecture

### Component Tree — User Dashboard

```
UserDashboardPage
├── ProtectedRoute
└── AppLayout
    ├── PageHeader ("Transaction Simulator")
    ├── SimulatorCard (glassmorphism, lg:col-span-1)
    │   ├── SimulatorForm (merchant, amount, location, method)
    │   ├── AnalyzeButton (disabled + spinner while loading)
    │   └── PredictionResultCard (conditional, animated)
    │       ├── AnomalyBanner (red dark scheme) OR CleanBanner (green light scheme)
    │       ├── RiskScore + ConfidenceLevel
    │       └── ReasonsList
    └── RecentSimulationsList (up to 5 rows, RiskBadge per row)
```

### Component Tree — Admin Dashboard

```
AdminDashboardPage
├── ProtectedRoute
└── AppLayout
    ├── PageHeader ("Fraud Analysis") + TimeFilterPills (7D/30D/90D)
    ├── StatCards row (6 cards: Total Tx, Total Amount, Avg Risk, Active Alerts, High Severity, Peak Risk)
    ├── ChartsRow1 (2-col grid)
    │   ├── TransactionVolumeChart (AreaChart, time-filtered)
    │   └── RiskScoreTrendChart (AreaChart dark, time-filtered)
    ├── ChartsRow2 (3-col grid)
    │   ├── RiskBreakdownPie (PieChart)
    │   ├── CategoryBarChart (BarChart horizontal)
    │   └── SuspiciousTransactionsList (anomalies only, clickable → ExplainabilityDrawer)
    ├── BottomRow (2-col grid)
    │   ├── RecentTransactionsList (clickable → ExplainabilityDrawer)
    │   └── AlertManagementPanel (Review → changeStatus)
    └── ExplainabilityDrawer (shared)
```

## Data Flow

```
User fills SimulatorForm
  → handleSimulate()
    → scoreTransaction(input)          // src/lib/risk.ts (unchanged)
    → setResult(scored)                // local state → renders PredictionResultCard
    → addTransaction(payload)          // src/services/transactionService.ts (unchanged)
      → Supabase INSERT
        → realtime subscription fires
          → useTransactions() updates  // src/hooks/use-transactions.ts (unchanged)
            → Admin Dashboard re-renders with new data
```

## Key Design Decisions

### User Dashboard
- **Remove all stat cards** — the 4 stat cards (Total Transactions, Total Spent, Avg Risk Score, Active Alerts) are deleted entirely.
- **Remove all charts** — the 14-day AreaChart and risk PieChart are deleted.
- **Remove alerts section** — the "My Recent Alerts" ChartCard is deleted.
- **Remove recent transactions ChartCard** — replaced by a minimal `RecentSimulationsList` (plain list, no ChartCard wrapper, max 5 rows).
- **Layout** — single column on mobile, `lg:grid-cols-2` for simulator + result card side-by-side on desktop.
- **Prediction result card** — rendered inside the same glassmorphism card as the form, below the form, with `motion.div` entrance animation.

### Admin Dashboard
- **No changes to data sourcing** — `useTransactions()` and `useAlerts()` already enforce RLS user-scoping. No new queries.
- **6 stat cards** — adds "High Severity Alerts" and "Peak Risk Score" to the existing 4.
- **Time filter** — existing `7D/30D/90D` pills already implemented; kept as-is.
- **All charts preserved** — AreaChart (volume), AreaChart dark (risk trend), PieChart (breakdown), BarChart (category).
- **Suspicious transactions** — filtered `transactions.filter(t => t.isAnomaly)`, clickable rows open ExplainabilityDrawer.
- **Alert management** — `changeStatus(id, "Under Review")` on "Review →" click, already implemented.

## File Changes

| File | Action |
|------|--------|
| `src/routes/user-dashboard.tsx` | **Rewrite** — remove charts/stats/alerts, keep simulator + result + minimal recent list |
| `src/routes/admin-dashboard.tsx` | **Enhance** — add 2 extra stat cards, ensure all panels present, polish layout |

All other files are **unchanged**.

## Styling Conventions

- Glassmorphism card: `bg-white rounded-3xl border border-[#E8E6E0]` + `boxShadow: "0 2px 16px rgba(0,0,0,0.06)"`
- Dark card: `bg-[#0A0A0A] border-white/10 text-white`
- Primary green: `#00C853` / hover `#00B347`
- Danger red: `#FF3B30`
- Warning orange: `#FF9500`
- Body text: `#0A0A0A` / muted: `#6B6B6B`
- Framer Motion entrance: `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}`
