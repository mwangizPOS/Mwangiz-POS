# MWANGI'Z Salon POS Database Design

Target database: Supabase PostgreSQL.

This document captures the logical database design. The physical PostgreSQL schema now lives in `schema.sql`, with relationship and constraint notes in `docs/database-relationships.md`.

This document does not define API routes, backend logic, authentication implementation, M-Pesa implementation, repositories, or services.

## Naming Convention

PostgreSQL tables and columns should use `snake_case`.

Application/domain fields use `camelCase`. Example:

- Domain: `saleNumber`
- Database: `sale_number`

## Type Standards

Recommended PostgreSQL data types:

- IDs: `uuid`
- Timestamps: `timestamptz`
- Money: `numeric(12, 2)`
- Percentages: `numeric(5, 2)`
- Enums: PostgreSQL enum types or constrained text values
- Metadata and payloads: `jsonb`
- Worker skills: `text[]`

Money should not use floating point types.

## Tables

### 1. users

Purpose: application users and future authorization identity.

Columns:

- `id`: uuid primary key
- `email`: text, required, unique
- `password_hash`: text, required
- `role`: enum/text, required, values `SuperAdmin`, `BranchManager`, `Cashier`
- `active`: boolean, required, default true
- `created_at`: timestamptz, required
- `updated_at`: timestamptz, required

Indexes:

- unique index on `email`
- index on `role`
- index on `active`

Notes:

- If Supabase Auth is adopted later, `users.id` should reference `auth.users.id`, and `password_hash` may move out of the application schema.
- Do not store plaintext passwords.

### 2. branches

Purpose: multi-branch business structure.

Columns:

- `id`: uuid primary key
- `name`: text, required
- `code`: text, required, unique
- `address`: text, required
- `manager_id`: uuid, required, references `users.id`
- `active`: boolean, required, default true
- `created_at`: timestamptz, required
- `updated_at`: timestamptz, required

Indexes:

- unique index on `code`
- index on `manager_id`
- index on `active`

### 3. services

Purpose: service catalog and commission source.

Columns:

- `id`: uuid primary key
- `name`: text, required
- `default_price`: numeric(12, 2), required
- `commission_percent`: numeric(5, 2), required
- `active`: boolean, required, default true
- `created_at`: timestamptz, required
- `updated_at`: timestamptz, required

Indexes:

- index on `active`
- optional unique index on lower-cased `name` if duplicate service names are not allowed

Constraints:

- `default_price >= 0`
- `commission_percent >= 0`
- `commission_percent <= 100`

Rules:

- Commission belongs to service.
- Workers never store commission percentages.

### 4. workers

Purpose: branch staff who perform sale items.

Columns:

- `id`: uuid primary key
- `branch_id`: uuid, required, references `branches.id`
- `full_name`: text, required
- `phone`: text, required
- `skills`: text[], required, default empty array
- `active`: boolean, required, default true
- `created_at`: timestamptz, required
- `updated_at`: timestamptz, required

Indexes:

- index on `branch_id`
- index on `active`
- index on `phone`
- optional compound index on `(branch_id, active)`

Rules:

- Skills are informational only.
- Skills must not control service selection logic.

### 5. sales

Purpose: one checkout, one receipt, one payment event.

Columns:

- `id`: uuid primary key
- `sale_number`: text, required, unique
- `branch_id`: uuid, required, references `branches.id`
- `payment_method`: enum/text, required, values `Cash`, `Mpesa`, `Bank`, `Mixed`
- `payment_status`: enum/text, required, values `Pending`, `Paid`, `Failed`, `Cancelled`, `Refunded`, `PartiallyRefunded`
- `subtotal`: numeric(12, 2), required
- `refund_amount`: numeric(12, 2), required, default 0
- `total_amount`: numeric(12, 2), required
- `sync_status`: enum/text, required, values `Pending`, `Synced`, `Failed`
- `created_by`: uuid, required, references `users.id`
- `created_at`: timestamptz, required
- `updated_at`: timestamptz, required

Required indexes:

- unique index on `sale_number`
- index on `branch_id`
- index on `created_at`

Recommended indexes:

- compound index on `(branch_id, created_at)`
- index on `payment_status`
- index on `sync_status`
- index on `created_by`

Constraints:

- `subtotal >= 0`
- `refund_amount >= 0`
- `total_amount >= 0`
- `refund_amount <= subtotal`

Notes:

- Sale totals are receipt summaries.
- Worker earnings, top workers, and top services must derive from `sale_items`.

### 6. sale_clients

Purpose: lightweight grouping labels inside one sale.

This is not customer management.

Columns:

- `id`: uuid primary key
- `sale_id`: uuid, required, references `sales.id`
- `label`: text, required

Examples:

- `Client 1`
- `Client 2`
- `Child A`
- `Mother`

Indexes:

- index on `sale_id`

Constraints:

- optional unique index on `(sale_id, label)` if each label should be unique inside one sale

Notes:

- Do not add loyalty, history, contact, identity, or billing fields to this table yet.

### 7. sale_items

Purpose: one service performed by one worker.

Columns:

- `id`: uuid primary key
- `sale_id`: uuid, required, references `sales.id`
- `sale_client_id`: uuid, nullable, references `sale_clients.id`
- `service_id`: uuid, required, references `services.id`
- `worker_id`: uuid, required, references `workers.id`
- `unit_price`: numeric(12, 2), required
- `commission_percent`: numeric(5, 2), required
- `worker_revenue`: numeric(12, 2), required
- `salon_revenue`: numeric(12, 2), required
- `refunded_amount`: numeric(12, 2), required, default 0
- `created_at`: timestamptz, required

Required indexes:

- index on `sale_id`
- index on `worker_id`
- index on `service_id`

Recommended indexes:

- compound index on `(worker_id, created_at)` for settlement and worker reports
- compound index on `(service_id, created_at)` for service analytics
- compound index on `(sale_id, worker_id)` for receipt detail and worker attribution

Constraints:

- `unit_price >= 0`
- `commission_percent >= 0`
- `commission_percent <= 100`
- `worker_revenue >= 0`
- `salon_revenue >= 0`
- `refunded_amount >= 0`
- `refunded_amount <= unit_price`

Cross-row rule:

- If `sale_client_id` is present, that sale client must belong to the same `sale_id`.
- This cannot be guaranteed by a simple single-column foreign key alone. Use a composite foreign key or backend validation when migrations are created.

Rules:

- Analytics derive from this table.
- Settlement calculations derive from this table.
- `commission_percent` snapshots the service commission used for the sale item.

### 8. split_payments

Purpose: one split tender attached to one sale.

Columns:

- `id`: uuid primary key
- `sale_id`: uuid, required, references `sales.id`
- `cash_amount`: numeric(12, 2), required, default 0
- `mpesa_amount`: numeric(12, 2), required, default 0
- `bank_amount`: numeric(12, 2), required, default 0

Indexes:

- unique index on `sale_id`

Constraints:

- `cash_amount >= 0`
- `mpesa_amount >= 0`
- `bank_amount >= 0`
- Split total must equal `sales.total_amount`.

Important:

- `cash_amount + mpesa_amount + bank_amount = sales.total_amount` is a cross-table constraint.
- PostgreSQL `CHECK` constraints cannot directly reference another table.
- Enforce this through backend validation, a database trigger, or a deferred constraint design when migrations are created.

Rules:

- A sale has one payment event.
- Never create multiple payment rows for one sale.

### 9. refunds

Purpose: sale-level and sale-item-level refunds.

Columns:

- `id`: uuid primary key
- `sale_id`: uuid, required, references `sales.id`
- `sale_item_id`: uuid, nullable, references `sale_items.id`
- `refund_type`: enum/text, required, values `Partial`, `Full`
- `refund_amount`: numeric(12, 2), required
- `reason`: text, required
- `status`: enum/text, required, values `Pending`, `Approved`, `Rejected`, `Completed`
- `requested_by`: uuid, required, references `users.id`
- `approved_by`: uuid, nullable, references `users.id`
- `created_at`: timestamptz, required

Indexes:

- index on `sale_id`
- index on `sale_item_id`
- index on `status`
- index on `requested_by`
- index on `approved_by`
- index on `created_at`

Constraints:

- `refund_amount > 0`

Cross-row rules:

- If `sale_item_id` is present, the referenced sale item must belong to the same `sale_id`.
- Sale-level refunds use `sale_item_id = null`.
- Sale-item refunds use a non-null `sale_item_id`.
- Refund totals cannot exceed remaining refundable sale or item amount.
- These constraints require backend validation, triggers, or deferred constraint design.

### 10. worker_settlements

Purpose: worker payout accounting for a period.

Columns:

- `id`: uuid primary key
- `worker_id`: uuid, required, references `workers.id`
- `amount`: numeric(12, 2), required
- `period_start`: timestamptz, required
- `period_end`: timestamptz, required
- `paid_by`: uuid, required, references `users.id`
- `status`: enum/text, required, values `Pending`, `Paid`
- `created_at`: timestamptz, required

Indexes:

- index on `worker_id`
- index on `status`
- compound index on `(worker_id, period_start, period_end)`
- index on `created_at`

Constraints:

- `amount >= 0`
- `period_end >= period_start`

Rules:

- Settlement calculations derive from `sale_items`.
- Do not calculate settlements from sale totals.

### 11. audit_logs

Purpose: immutable audit trail.

Columns:

- `id`: uuid primary key
- `action`: enum/text, required, values `SaleCreated`, `RefundRequested`, `RefundApproved`, `SettlementPaid`
- `entity_type`: enum/text, required
- `entity_id`: uuid, required
- `performed_by`: uuid, required, references `users.id`
- `branch_id`: uuid, required, references `branches.id`
- `metadata`: jsonb, required, default empty object
- `timestamp`: timestamptz, required

Required indexes:

- index on `entity_id`
- index on `performed_by`
- index on `timestamp`

Recommended indexes:

- compound index on `(branch_id, timestamp)`
- compound index on `(entity_type, entity_id)`
- index on `action`

Notes:

- `entity_id` is polymorphic. It cannot have one normal foreign key to every possible entity table.
- Store enough metadata to reconstruct why an action occurred.
- Audit rows should be append-only.

### 12. offline_queue

Purpose: local sync tracking metadata.

Primary location:

- SQLite on the desktop device.

Optional cloud use:

- Supabase can mirror accepted or failed sync attempts for diagnostics, but PostgreSQL remains the source of truth for business records.

Columns:

- `id`: uuid primary key
- `action_type`: enum/text, required
- `payload`: jsonb, required
- `sync_status`: enum/text, required, values `Pending`, `Synced`, `Failed`
- `retry_count`: integer, required, default 0
- `created_at`: timestamptz, required

Indexes:

- index on `sync_status`
- index on `created_at`
- compound index on `(sync_status, created_at)`

Constraints:

- `retry_count >= 0`

SQLite mapping:

- Same logical columns can be stored in SQLite.
- `payload` should be serialized JSON text locally.
- IDs should be UUID strings generated client-side before sync.
- Server response should map the client-generated UUID to the accepted PostgreSQL row.

## ERD-Style Relationships

```text
User
|-- Branch.manager_id
|-- Sale.created_by
|-- Refund.requested_by
|-- Refund.approved_by
|-- WorkerSettlement.paid_by
|-- AuditLog.performed_by

Branch
|-- Workers
|-- Sales
|-- AuditLogs

Service
|-- SaleItems

Worker
|-- SaleItems
|-- WorkerSettlements

Sale
|-- SaleClients
|-- SaleItems
|-- SplitPayment
|-- Refunds

SaleClient
|-- SaleItems

SaleItem
|-- Refunds

AuditLog
|-- User through performed_by
|-- Branch through branch_id
|-- Polymorphic entity through entity_type + entity_id

OfflineQueue
|-- Local SQLite action payloads
|-- Sync engine submission to backend
|-- Accepted writes into PostgreSQL source-of-truth tables
```

## Foreign Key Relationships

- `branches.manager_id` -> `users.id`
- `workers.branch_id` -> `branches.id`
- `sales.branch_id` -> `branches.id`
- `sales.created_by` -> `users.id`
- `sale_clients.sale_id` -> `sales.id`
- `sale_items.sale_id` -> `sales.id`
- `sale_items.sale_client_id` -> `sale_clients.id`
- `sale_items.service_id` -> `services.id`
- `sale_items.worker_id` -> `workers.id`
- `split_payments.sale_id` -> `sales.id`
- `refunds.sale_id` -> `sales.id`
- `refunds.sale_item_id` -> `sale_items.id`
- `refunds.requested_by` -> `users.id`
- `refunds.approved_by` -> `users.id`
- `worker_settlements.worker_id` -> `workers.id`
- `worker_settlements.paid_by` -> `users.id`
- `audit_logs.performed_by` -> `users.id`
- `audit_logs.branch_id` -> `branches.id`

Recommended delete behavior:

- Use `RESTRICT` for financial and audit relationships.
- Do not hard-delete sales, sale items, refunds, settlements, or audit logs.
- Use `active` flags for operational records that can be disabled.

## Index Strategy

Analytics:

- `sale_items(service_id, created_at)`
- `sale_items(worker_id, created_at)`
- `sales(branch_id, created_at)`
- `refunds(sale_item_id)`

Settlement queries:

- `sale_items(worker_id, created_at)`
- `worker_settlements(worker_id, period_start, period_end)`
- `worker_settlements(status)`

Branch filtering:

- `workers(branch_id, active)`
- `sales(branch_id, created_at)`
- `audit_logs(branch_id, timestamp)`

Audit history:

- `audit_logs(entity_type, entity_id)`
- `audit_logs(performed_by)`
- `audit_logs(timestamp)`
- `audit_logs(action)`

Date-range reports:

- `sales(created_at)`
- `sales(branch_id, created_at)`
- `sale_items(created_at)`
- `refunds(created_at)`
- `worker_settlements(created_at)`

## Soft Delete Strategy

Recommendation:

- Use `active` for operational master records: `users`, `branches`, `services`, `workers`.
- Do not use soft delete for financial records: `sales`, `sale_items`, `split_payments`, `refunds`, `worker_settlements`, `audit_logs`.
- Do not hard-delete audit or financial records.

Why:

- `active` keeps cashier workflows clean without losing historical references.
- Financial records must remain immutable for auditability.
- Adding `deleted_at` everywhere creates ambiguity around historical reporting and settlement calculations.

Future option:

- If legal retention workflows require deletion markers, add `archived_at` or `voided_at` to specific records with explicit audit events. Do not use generic deletion on financial rows.

## Sync Strategy

Flow:

```text
SQLite
-> Sync Engine
-> Backend
-> PostgreSQL
```

Rules:

- PostgreSQL is the source of truth.
- SQLite is a temporary offline fallback only.
- Client-generated UUIDs should be used for offline-created records.
- Every offline payload should include a stable local ID and action type.
- Backend should accept idempotent sync writes.
- Server wins during conflicts.
- Failed sync attempts remain in the local queue with `sync_status = Failed` and incremented `retry_count`.
- Accepted sync attempts become `Synced` locally after the backend confirms PostgreSQL persistence.

ID safety:

- Use UUIDs across SQLite and PostgreSQL.
- Avoid temporary integer IDs.
- Keep local IDs stable across retries.
- For any future server-generated identifiers, store a mapping from local UUID to server UUID before marking the item synced.

Conflict handling:

- Catalog changes such as service price or commission should be resolved by the server.
- Offline sale items should snapshot `unit_price` and `commission_percent` used at checkout time.
- Server response should decide whether a stale offline payload is accepted, corrected, or rejected.

## Constraints Discovered

Some important constraints are cross-table or aggregate constraints and cannot be represented as simple single-row `CHECK` constraints:

- Split payment total must equal `sales.total_amount`.
- Sale subtotal should equal the sum of related `sale_items.unit_price`.
- Sale refund amount should equal accepted refund totals.
- A sale item refund cannot exceed the remaining refundable amount for that item.
- A sale-level refund cannot exceed the remaining refundable amount for that sale.
- `refunds.sale_item_id`, when present, must belong to the same sale as `refunds.sale_id`.
- `sale_items.sale_client_id`, when present, must belong to the same sale as `sale_items.sale_id`.

These should be enforced by backend validation and, where useful, database triggers or deferred constraints when migrations are designed.

## Future Considerations

Partitioning:

- If sales volume grows heavily, consider time-based partitioning for `sales`, `sale_items`, `refunds`, and `audit_logs`.

Materialized views:

- Consider materialized views for daily revenue, top workers, top services, and settlement preparation.
- Source materialized analytics from `sale_items`, not from sale totals alone.

Branch isolation:

- Future row-level security can enforce branch scoping for BranchManagers and Cashiers.
- SuperAdmin should be able to query across branches.

Receipts:

- If receipt rendering needs immutable snapshots, add a future `receipt_snapshots` table or store receipt metadata in `sales`.

Payments:

- M-Pesa provider details should not be added until payment orchestration is designed.
- Future provider references can attach to `sales` or a separate payment metadata table without changing the one-payment-per-sale rule.

Customer management:

- `sale_clients` is not a customer table.
- Add a separate customer module later if loyalty, history, or contact management becomes a requirement.
