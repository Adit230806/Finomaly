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

The UI never calls `analyzeTransaction()` directly for persistence. `createTransaction()` in `transactionService.ts` runs `src/utils/anomalyDetection.ts`, which scores on:

| Signal | Rule |
|--------|------|
| **Amount** | vs trusted median/avg + 2σ; absolute &gt; ₹20,000 |
| **Location** | Not in trusted location history |
| **Type** | Not in common trusted types; Crypto / large bank transfer |

**Learning rule:** only transactions with **risk score &lt; 30** update the behavioral profile (last 30 trusted rows). Anomalies are flagged and excluded from averages.

**Hybrid ML (production):** FastAPI + Isolation Forest (`ml-api/`) — `finalScore = ruleScore×0.4 + mlScore×0.6`. See `ML_DEPLOYMENT.md`.

Status: `Normal` (&lt;30) · `Suspicious` (30–59) · `Anomalous` (≥60)

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

## Deployment

| Platform | How |
|----------|-----|
| **Vercel** | Connect GitHub repo. Build runs `npm run build` with `VERCEL=1` (automatic), which enables **Nitro** and disables the Cloudflare plugin. Redeploy after env vars are set. |
| **Cloudflare** | `npm run build` (default) then `npx wrangler deploy` using `dist/server` + `dist/client` assets. |

### Vercel environment variables (required)

Set in Project → Settings → Environment Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Without these, the app may build but auth/data will fail at runtime.

If you see `404: NOT_FOUND` with an ID like `bom1::…`, the deployment was missing a server adapter (fixed by Nitro on Vercel).
