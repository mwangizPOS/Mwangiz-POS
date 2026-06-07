# Projection Engine

The projection engine converts the append-only `event_store` into read-optimized tables for dashboards, cashier views, analytics, admin KPIs, worker earnings, refunds, and audit history.

```text
event_store
-> projection engine
-> sales_projection
-> sale_items_projection
-> worker_earnings_projection
-> branch_revenue_projection
-> refund_projection
-> audit_projection
```

## Tables

The SQL lives in `projections.sql`.

- `sales_projection`: one row per Sale with branch, status, total, and timestamps.
- `sale_items_projection`: one row per SaleItem with worker, service, client grouping, amount, commission amount, and deterministic replay support columns.
- `worker_earnings_projection`: aggregate worker earnings split into total, unpaid, and paid.
- `branch_revenue_projection`: branch revenue, refunds, and net revenue.
- `refund_projection`: refund read model for global sale refunds and item refunds.
- `audit_projection`: compact action feed for who / what / when.
- `projection_processed_events`: checkpoint table keyed by `event_id` and `projection_name`.

## Event Mapping

The prompt names a few conceptual events. The existing contract names are:

- `RefundApplied` maps to `RefundProcessed`.
- `SettlementUpdated` maps to `WorkerSettlementCalculated`, `WorkerPaid`, and `WorkerSettlementMarkedPaid`.
- `AuditLogged` maps to `AuditLogCreated`.

The engine also handles `SaleCompleted`, `SaleCancelled`, `SaleItemUpdated`, `SaleItemRemoved`, `RefundRequested`, `RefundApproved`, and `RefundRejected` because those events change queryable state.

## Engine API

```ts
import {
  processPendingProjectionEvents,
  rebuildProjectionsFromEventStore,
} from '@/projections'

await processPendingProjectionEvents()
await rebuildProjectionsFromEventStore()
```

`processPendingProjectionEvents()` loads processed events from `event_store` that are not present in `projection_processed_events`, applies reducers in deterministic order, and checkpoints each event in the same transaction as its projection writes.

`rebuildProjectionsFromEventStore()` truncates projection tables and replays the full event stream. This is safe because projection tables are derived state only.

## Ordering

Events are processed by:

1. `occurred_at`
2. `aggregate_id`
3. `version`
4. `recorded_at`
5. `event_id`

This gives stable replay ordering while respecting sale aggregate timelines.

## Idempotency

Every projection write is guarded by `projection_processed_events`.

If an event is already checkpointed for the projection name, the engine skips it. If a reducer fails, the transaction rolls back and the event is not checkpointed, so the engine can safely retry.

## Reducer Scope

Projection reducers do not validate business rules. They transform already accepted events into read models:

- Sale totals are recalculated from SaleItems.
- Worker earnings are recalculated from SaleItems.
- Branch revenue is recalculated from completed sale items and completed refunds.
- Refund events update refund read state and adjust derived item amounts.
- Settlement events update paid/unpaid worker earnings.
- Audit events populate the compact audit feed.

Business invariants remain in the backend event processor.
