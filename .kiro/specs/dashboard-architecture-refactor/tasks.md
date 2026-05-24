# Implementation Tasks

## Task 1: Rewrite User Dashboard as Simulator-Only Interface

Rewrite `src/routes/user-dashboard.tsx` to remove all analytics content and keep only the transaction simulation interface.

### Sub-tasks

- [x] 1.1 Remove all imports no longer needed: `StatCard`, `AreaChart`, `Area`, `PieChart`, `Pie`, `Cell`, `CartesianGrid`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer`, `ArrowLeftRight`, `Shield`, `Bell`, `AlertTriangle`, `DollarSign`, `subDays`, `format`, `useAlerts`, `Link` (to alerts/history)
- [x] 1.2 Remove all derived stats (`anomalies`, `avgRisk`, `newAlerts`, `totalAmt`, `volData`, `riskPie`)
- [x] 1.3 Remove the 4 stat cards grid (`grid grid-cols-2 lg:grid-cols-4`)
- [x] 1.4 Remove the "My Activity Chart" (14-day AreaChart ChartCard)
- [x] 1.5 Remove the "My Risk Breakdown" PieChart ChartCard
- [x] 1.6 Remove the "My Recent Transactions" ChartCard (the full one with ExplainabilityDrawer click handler)
- [x] 1.7 Remove the "My Recent Alerts" ChartCard section
- [x] 1.8 Remove the `ExplainabilityDrawer` and its `selected` state (no longer needed on user dashboard)
- [x] 1.9 Update the page header: title "Transaction Simulator", subtitle "Submit a transaction and get an instant fraud prediction"
- [x] 1.10 Keep the simulator form card (glassmorphism `bg-white rounded-3xl border border-[#E8E6E0]`) with all 4 fields (merchant, amount, location, payment method) and the Analyze button with loading state
- [ ] 1.11 Keep the `PredictionResultCard` inside the simulator card with anomaly/clean colour schemes and reasons list
- [~] 1.12 Add a minimal `RecentSimulationsList` below the simulator card: plain list (no ChartCard wrapper), up to 5 rows, each row shows merchant initial avatar, merchant name, amount, relative timestamp, and `RiskBadge`. Use `useTransactions()` data. Show a simple empty state if no transactions yet.
- [~] 1.13 Layout: on mobile stack simulator card full-width; on `lg` breakpoint use `grid grid-cols-2 gap-6` with simulator on left and result card area on right (or keep single column with result below form — whichever is cleaner). The recent simulations list spans full width below.
- [~] 1.14 Preserve Framer Motion entrance animations on the simulator card and recent list

### Requirements addressed
- Requirement 1 (simulator-only interface)
- Requirement 2 (removed analytics content)
- Requirement 5.2 (preserve addTransaction + useTransactions usage)
- Requirement 6 (preserved visual design)

---

## Task 2: Enhance Admin Dashboard as Full Analytics Hub

Enhance `src/routes/admin-dashboard.tsx` to be the complete fraud command center with all analytics panels.

### Sub-tasks

- [~] 2.1 Expand stat cards from 4 to 6: add "High Severity Alerts" (count of `alerts.filter(a => a.severity === "high")`) and "Peak Risk Score" (max riskScore across all transactions) as two additional StatCard components
- [~] 2.2 Ensure the stat cards grid uses `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6` (or `lg:grid-cols-3 xl:grid-cols-6`) so all 6 fit responsively
- [~] 2.3 Verify the Transaction Volume AreaChart is present and time-filtered by `days` variable — it already exists, confirm it renders correctly
- [~] 2.4 Verify the Risk Score Trend dark AreaChart is present and time-filtered — it already exists, confirm it renders correctly
- [~] 2.5 Verify the Risk Breakdown PieChart is present — it already exists, confirm it renders correctly
- [~] 2.6 Verify the Category Analysis BarChart is present — it already exists, confirm it renders correctly
- [~] 2.7 Verify the Suspicious Transactions list is present with click-to-open ExplainabilityDrawer — it already exists, confirm it renders correctly
- [~] 2.8 Verify the Recent Transactions list is present with click-to-open ExplainabilityDrawer — it already exists, confirm it renders correctly
- [~] 2.9 Verify the Alert Management panel is present with "Review →" button calling `changeStatus` — it already exists, confirm it renders correctly
- [~] 2.10 Add loading spinners: WHILE `loading` is true, render a centered spinner inside each ChartCard in place of chart content
- [~] 2.11 Add empty state messages: IF `transactions.length === 0`, render an EmptyState message inside each chart/list panel
- [~] 2.12 Ensure the time-filter pills (7D/30D/90D) appear in the page header area and correctly update the `days` variable used by both time-sensitive charts
- [~] 2.13 Polish the page header: "Admin Panel" badge, "Fraud Analysis" title, authenticated user email subtitle
- [~] 2.14 Preserve all Framer Motion entrance animations with staggered `delay` props on each ChartCard

### Requirements addressed
- Requirement 3 (full analytics hub)
- Requirement 4 (data scope constraint — no new queries)
- Requirement 5.1 (realtime reflection via existing useTransactions)
- Requirement 6 (preserved visual design)
