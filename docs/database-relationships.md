# MWANGI'Z Salon POS Physical Database Relationships

This document explains the physical PostgreSQL schema in `schema.sql`.

The database is the persistence, constraint, and query optimization layer. Business logic remains in the backend event processor.

## ERD-Style Relationships

```text
users
|-- branches.manager_id
|-- sales.created_by
|-- refunds.requested_by
|-- refunds.approved_by
|-- worker_settlements.paid_by
|-- audit_logs.performed_by
|-- event_store.actor_id

branches
|-- workers.branch_id
|-- sales.branch_id
|-- worker_settlements.branch_id
|-- audit_logs.branch_id
|-- event_store.branch_id

services
|-- sale_items.service_id

workers
|-- sale_items.worker_id
|-- worker_settlements.worker_id

sales
|-- sale_clients.sale_id
|-- sale_items.sale_id
|-- split_payments.sale_id
|-- refunds.sale_id for sale-level refunds

sale_clients
|-- sale_items.sale_client_id

sale_items
|-- refunds.sale_item_id for item-level refunds

event_store
|-- idempotency_keys.event_id
|-- offline_queue.event_id

audit_logs
|-- polymorphic entity reference through entity_type + entity_id

offline_queue
|-- local and cloud sync metadata
```

## Key Physical Design Choices

- `sales` is the receipt/check-out header.
- `sale_items` is the financial source of truth.
- `sale_clients` is only an in-sale grouping label, not customer management.
- `split_payments` is one row per sale and only applies when `sales.payment_method = Mixed`.
- `refunds` can target either a whole sale or a single sale item.
- `worker_settlements` stores settlement projections derived from sale items.
- `event_store` persists immutable events for replay and idempotency.
- `idempotency_keys` prevents duplicate event processing.
- `audit_logs` stores append-only audit projections.

## Constraints Enforced In SQL

The schema enforces:

- strict foreign keys for branches, users, workers, services, sales, sale items, refunds, settlements, events, and audit logs
- no cascade deletes for financial history
- active flags for operational records
- non-negative money values
- commission percentage range from 0 to 100
- sale total summary consistency: `total_amount = subtotal - refund_amount`
- sale item net revenue consistency for active/refunded items
- removed sale items must have zero worker and salon revenue
- sale clients referenced by sale items must belong to the same sale
- refund target shape:
  - sale-level refund requires `sale_id` and no `sale_item_id`
  - item-level refund requires `sale_item_id` and no `sale_id`
- paid settlements require full paid amount, `paid_by`, and `paid_at`
- event id and idempotency key uniqueness
- JSON payload/metadata columns must contain JSON objects

## Constraints That Remain In The Event Processor

Some rules are cross-row, aggregate, temporal, or event-order dependent. They remain in the backend event processor:

- `sales.subtotal` must equal the sum of active `sale_items.price * sale_items.quantity`.
- `sales.refund_amount` must equal completed refund effects across sale items.
- `split_payments.cash_amount + mpesa_amount + bank_amount` must equal `sales.total_amount`.
- Refunds must never exceed remaining refundable value.
- Sale-level refunds must be distributed safely across sale items.
- Item-level refund processing must recalculate worker and salon revenue.
- Worker settlement totals must derive only from eligible sale items in the settlement period.
- Events must be processed in order per aggregate.
- Server wins during sync conflicts.
- Duplicate events must be ignored without changing projections twice.

## Index Coverage

The schema includes indexes for:

- branch filtering: `sales(branch_id, created_at)`, `workers(branch_id, active)`, `audit_logs(branch_id, timestamp)`
- worker performance: `sale_items(worker_id, created_at)`
- service analytics: `sale_items(service_id, created_at)`
- settlement queries: `worker_settlements(worker_id, period_start, period_end)`, `worker_settlements(status)`
- sale date filtering: `sales(created_at)`, `sales(branch_id, created_at)`
- refund tracking: `refunds(sale_id)`, `refunds(sale_item_id)`, `refunds(status)`
- audit filtering: `audit_logs(entity_type, entity_id)`, `audit_logs(performed_by)`, `audit_logs(action)`
- event replay: `event_store(aggregate_type, aggregate_id, occurred_at)`
- sync retry processing: `offline_queue(sync_status, next_retry_at, retry_count)`

## Delete Strategy

- Operational records use `active`: users, branches, services, workers.
- Financial and audit records are not hard-deleted.
- Foreign keys use restrictive delete behavior except `offline_queue.event_id`, which can be set null if an event record is removed during maintenance.

## Notes Before Deployment

- Supabase row-level security policies are not included yet.
- Payment provider metadata is intentionally not modeled yet.
- Customer management is intentionally not modeled yet.
- Materialized reporting views can be added later, sourced primarily from `sale_items`.
