# Finomaly Architecture

## Layered flow

```
Frontend (React)
   ↓
Hooks (use-transactions, use-alerts)
   ↓
Services (transactionService, alertService)
   ↓
Risk engine (lib/risk.ts — scoreTransaction)
   ↓
Supabase
   ├── Auth
   ├── Postgres + RLS
   └── Realtime (filtered by user_id)
```

## Key design decisions

### Service-owned fraud logic

The UI never calls `scoreTransaction()` directly for persistence. `createTransaction()` in `transactionService.ts` runs scoring, writes `risk_score`, `confidence`, `anomaly_reasons`, and creates alerts when thresholds are met.

### Persisted explainability

| Column | Purpose |
|--------|---------|
| `confidence` | Model confidence (0–99) |
| `anomaly_reasons` | Human-readable risk signals |
| `ip_address` | Request context |
| `device_fingerprint` | Client device hint |

Legacy columns `confidence_level` and `explanation` are still written for backward compatibility.

### Realtime

Subscriptions use Postgres filters:

```ts
filter: `user_id=eq.${user.id}`
```

This scopes events per user and avoids broadcast noise at scale.

### Centralized types

Domain types live in `src/types/` (`transaction.ts`, `alert.ts`, `auth.ts`). Services, hooks, and components import from `@/types`.

## Security note

**Current:** Risk scoring runs in the browser service layer. A motivated user could patch client code before insert.

**Future enhancement:** Move `scoreTransaction()` to a **Supabase Edge Function** or **Python API** so `risk_score` is never client-supplied. The database should reject or overwrite client-provided risk fields via RLS/triggers.

Recommended production flow:

```
Frontend → Edge Function → Risk Engine → Database
```

Until then, treat stored scores as **demo-trust** — suitable for portfolio demos, not production fraud decisions.

## Optional: Edge Functions (Phase 6)

Scaffold path: `supabase/functions/score-transaction/index.ts` calling the same rules as `lib/risk.ts` (shared module or port).

## Fraud timeline

`buildFraudTimeline()` synthesizes audit-style events (created → scored → alert → notified) for the explainability drawer — strong demo UX without a separate events table.

## Migrations

Apply `supabase/migrations/20260524140000_transaction_risk_columns.sql` in the Supabase SQL editor or via CLI.
