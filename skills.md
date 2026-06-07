# MWANGI'Z Salon POS Architecture Notes

## Architecture Principles

- The frontend is responsible for presentation, interaction state, and desktop shell ergonomics only.
- The backend is responsible for business logic, validation, permissions, payment orchestration, and workflow rules.
- The database is responsible for durable storage only.
- The cloud database is the source of truth.
- Offline data exists only as a temporary fallback for local continuity.
- Server wins when sync conflicts cannot be reconciled safely.
- Modules should be feature-oriented, but shared UI primitives stay in `src/components`.
- Keep cashier workflows fast, touch-friendly, and low-clutter.

## Online-First Approach

The application should assume connectivity to the cloud backend during normal operations. Reads and writes should prefer the backend API, which will coordinate with Supabase PostgreSQL and any payment providers.

Online responsibilities:

- authenticate users through the backend
- enforce role permissions server-side
- validate service, worker, branch, refund, and settlement rules
- create payment intents through backend-controlled workflows
- write auditable events to the cloud source of truth

## Offline Fallback Approach

Offline mode should keep the cashier flow usable for a short interruption, not become a second source of truth.

Offline responsibilities:

- cache only the minimum data needed for temporary operation
- queue locally created events in SQLite
- mark offline-created records clearly in the UI
- sync queued events when connectivity returns
- apply server responses as authoritative

Conflict policy:

- server wins by default
- client keeps a conflict audit trail
- user-facing correction workflows are added only after backend contracts exist

## Technology Stack

- Desktop shell: Electron
- Frontend: React, Vite, TypeScript
- Styling: Tailwind CSS with design tokens
- UI primitives: shadcn/ui conventions and Radix UI
- State: Zustand for UI state only at this stage
- Charts: Recharts
- Icons: Lucide React
- Animation: Framer Motion
- Networking: Axios
- Offline storage dependency: SQLite through `better-sqlite3`
- Future backend: Node.js and Express on Railway
- Future database: Supabase PostgreSQL

## User Roles

Initial role vocabulary for future backend authorization:

- Owner: full business oversight and configuration
- Manager: branch operations, workers, services, refunds, reports
- Cashier: checkout, receipts, payments, limited refunds
- Stylist or Worker: assigned service visibility and activity status
- Auditor: read-only access to audit, settlement, and reporting views

These roles are documented only. No authorization logic exists in the foundation.

## Future Engine Structure

Future backend engines should be isolated by responsibility:

- Auth engine: identity, sessions, roles, permissions
- Branch engine: branch settings, terminals, operating context
- Service engine: catalog, pricing, service availability
- Worker engine: staff records, assignments, commissions
- Payment engine: payment intents, M-Pesa, cash, card, receipts
- Refund engine: approvals, reversals, audit events
- Settlement engine: daily close, cash drawer, payout reconciliation
- Analytics engine: operational metrics and reporting views
- Audit engine: immutable event stream and compliance exports
- Sync engine: offline queue intake, conflict handling, replay safety

The UI should consume these engines through backend APIs only. The desktop app should not own domain decisions.
