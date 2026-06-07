# MWANGI'Z Salon POS Backend Event Processor

This document describes the backend event processing layer. It does not define frontend UI, database schema, SQL migrations, M-Pesa integration, authentication UI, or payment gateway calls.

## Purpose

The backend is an event processing engine and state reconstructor.

It receives validated `EventEnvelope` objects, applies sale-centric reducers, updates projections, records audit logs, and returns settlement recalculation triggers where worker earnings may have changed.

## Processing Flow

For every incoming event:

1. Validate the event with Zod.
2. Check `event_id` and `idempotency_key`.
3. Ignore duplicates safely.
4. Load projection state through `ProjectionStore`.
5. Apply the event reducer.
6. Enforce invariants.
7. Update projections.
8. Emit an audit log projection for sensitive events.
9. Return settlement recalculation triggers when sale item earnings change.
10. Mark the event as processed.

## Implemented Modules

- `src/backend/events/processor.ts`: orchestrates validation, idempotency, routing, audit, and event append.
- `src/backend/events/router.ts`: routes events to reducers.
- `src/backend/events/reducers.ts`: applies sale, sale item, payment, refund, settlement, and audit events.
- `src/backend/events/invariants.ts`: enforces sale totals, refund limits, split payment totals, and ownership rules.
- `src/backend/events/idempotency.ts`: idempotency port plus in-memory placeholder.
- `src/backend/events/store.ts`: projection store port plus in-memory placeholder.
- `src/backend/events/audit.ts`: audit log projection emitter.
- `src/backend/events/settlementTriggers.ts`: settlement recalculation trigger helper.

## Projection Ports

The processor depends on `ProjectionStore`, not a concrete database driver.

Current adapter:

- `InMemoryProjectionStore`

Future adapter:

- Supabase/PostgreSQL-backed store for Railway deployment

This keeps reducer logic independent from database schema and migrations.

## Event Handling

Sale events:

- `SaleCreated`: creates sale projection and lightweight client labels.
- `SaleCompleted`: validates item-derived total and marks sale completed.
- `SaleCancelled`: marks sale cancelled.

Sale item events:

- `SaleItemAdded`: inserts item, computes item revenue, recalculates sale totals, triggers settlement recalculation.
- `SaleItemUpdated`: updates item pricing/worker/service snapshot, recomputes revenue, recalculates totals, triggers settlement recalculation.
- `SaleItemRemoved`: marks item removed, zeroes item earnings, recalculates totals, triggers settlement recalculation.

Payment events:

- `PaymentInitiated`: marks sale as pending payment.
- `PaymentCompleted`: validates amount against sale total, marks sale paid/completed.
- `SplitPaymentRecorded`: validates split total against sale total and mixed tender.

Refund events:

- `RefundRequested`: validates remaining refundable amount.
- `RefundApproved`: records approval.
- `RefundRejected`: records rejection.
- `RefundProcessed`: applies refund against sale items first, recalculates item revenue and sale totals, triggers settlement recalculation.

Settlement events:

- `WorkerSettlementCalculated`: derives earnings from eligible sale items.
- `WorkerPaid`: marks settlement paid after amount validation.
- `WorkerSettlementMarkedPaid`: marks settlement paid.

Audit events:

- `AuditLogCreated`: stores an explicit audit projection.
- Most sensitive events also generate an audit projection automatically.

## Strict Invariants

The processor enforces:

- Sale total is derived from sale items.
- Refund cannot exceed remaining refundable value.
- Worker commission is derived only from sale items.
- Split payment must equal sale total.
- Sale item must belong to exactly one sale.
- No orphan sale items are allowed.
- Duplicate events are ignored through idempotency.

## Read Models

The processor returns projection update summaries for:

- `sales_summary_view`
- `worker_earnings_view`
- `branch_revenue_view`
- `refund_tracking_view`
- `audit_log_view`

The current implementation reports affected projection IDs. Future PostgreSQL adapters can use those summaries to refresh materialized views or update read models.

## Settlement Triggers

Settlement recalculation is triggered when worker earnings may change:

- sale item added
- sale item updated
- sale item removed
- refund processed

Settlement calculations derive from `SaleItem.workerRevenue`, never from sale totals.

## Future Work

- Replace `InMemoryProjectionStore` with a Supabase/PostgreSQL adapter.
- Replace `InMemoryIdempotencyStore` with persistent event-id and idempotency-key tracking.
- Add ordered processing per aggregate in the event ingestion layer.
- Add integration tests using recorded event streams.
- Add Railway service entrypoint after API transport is designed.
