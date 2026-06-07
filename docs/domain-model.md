# MWANGI'Z Salon POS Domain Model

This document defines the domain model for MWANGI'Z Salon POS before backend logic, database schema, authentication, M-Pesa, or migrations exist.

## Canonical Roles

The domain layer defines three system roles:

- `SuperAdmin`
- `BranchManager`
- `Cashier`

These values are shared contract values only. Authorization rules will be enforced by the future backend, not by the desktop UI.

## Core Discovery

A single checkout can include multiple clients, multiple services, and multiple workers, but still produce exactly one receipt and one payment event.

Example:

- Mother pays once.
- Child 1 receives Hair.
- Child 2 receives Nails.
- Mother receives Lashes and Pedicure.

Result:

- One `Sale`
- One receipt number through `Sale.saleNumber`
- One payment method or one split payment
- Multiple `SaleItem` records
- Optional lightweight `SaleClient` labels for Child 1, Child 2, and Mother

## Entity Relationships

`Sale` is the central checkout entity.

- A `Branch` has many `Worker` records.
- A `Branch` has many `Sale` records.
- A `Sale` has one or more `SaleItem` records.
- A `SaleItem` represents one service performed by one worker.
- A `Service` can appear in many `SaleItem` records.
- A `Worker` can appear in many `SaleItem` records.
- A `SaleClient` is an optional lightweight label inside one sale.
- A `SaleItem` may reference a `SaleClient` when the checkout contains multiple people.
- A `SplitPayment` references one `Sale`.
- A `Refund` references one `Sale` and may reference one `SaleItem`.
- A `WorkerSettlement` references one worker and is calculated from eligible `SaleItem` records.
- An `AuditLog` references the entity affected by an action.
- An `OfflineQueueItem` stores a pending client-side action payload until the server accepts or rejects it.

## Ownership Rules

- Frontend owns UI state, interaction flows, and display formatting.
- Backend owns business logic, validation decisions, permissions, payment orchestration, settlement workflows, and sync conflict handling.
- Database owns durable storage only.
- Cloud database remains the source of truth.
- Offline queue exists only as a temporary fallback during connectivity loss.

## Sale Rules

- `Sale` represents one checkout, one receipt, and one payment event.
- `Sale.saleNumber` is the receipt-facing identifier.
- `Sale.subtotal`, `Sale.refundAmount`, and `Sale.totalAmount` are sale-level totals.
- Sale totals are summaries only. They should not be used to calculate worker earnings, top workers, or top services.
- The domain layer does not calculate totals, commissions, status transitions, or sale numbers.

## SaleItem Rules

- `SaleItem` is the operational and accounting detail line.
- One `SaleItem` equals one service performed by one worker.
- Multiple services for the same client create multiple `SaleItem` records.
- Multiple workers in one checkout create multiple `SaleItem` records.
- Worker earnings are calculated from `SaleItem`, not from `Sale`.
- Service analytics are calculated from `SaleItem`, not from `Sale`.
- Revenue analytics can summarize sale totals, but worker and service attribution must come from `SaleItem`.

## Client Group Rules

Customer management is not part of the domain layer yet.

`SaleClient` exists only as a lightweight grouping label inside one sale:

- `Client A`
- `Client B`
- `Child 1`
- `Mother`

`SaleClient` is not a reusable customer profile. It should not contain loyalty, contact, billing, history, or identity-management fields yet.

## Payment Rules

- A `Sale` has one payment event.
- A `Sale` can use one direct payment method: `Cash`, `Mpesa`, or `Bank`.
- A `Sale` can use one split payment by setting payment method to `Mixed`.
- `SplitPayment` belongs to `Sale`.
- Never create multiple payments for one sale in this domain model.
- M-Pesa orchestration belongs to the future backend and is not implemented here.

## Revenue Rules

- `SaleItem.unitPrice` is the line amount before refunds.
- `SaleItem.workerRevenue` and `SaleItem.salonRevenue` are accounting values only.
- Money is never physically split between salon and worker inside the desktop app.
- Revenue allocation must be calculated and confirmed by the future backend.
- Refunds adjust accounting state through sale and refund records, not by deleting sale history.

## Commission Rules

- Commission belongs to `Service`.
- `Service.commissionPercent` is the canonical commission percentage source.
- `SaleItem.commissionPercent` captures the service commission used for that sale line.
- Workers never own commission percentages.
- Worker skills are informational only.
- Worker skills must not control service selection logic.

## Refund Rules

Refunds support:

- entire sale refund
- individual sale item refund
- partial sale item refund

Partial item refund is important because a client may dispute only one service inside a larger receipt.

Rules:

- `Refund.saleId` always references the original sale.
- `Refund.saleItemId` is present when the refund targets one sale item.
- `Refund.refundTarget` distinguishes `Sale` from `SaleItem`.
- Refund type values are `Partial` and `Full`.
- Refund status values are `Pending`, `Approved`, `Rejected`, and `Completed`.
- `approvedBy` may be `null` while a refund is pending or rejected.
- Sale payment status can become `PartiallyRefunded` or `Refunded`, but the future backend owns that transition.

## Settlement Rules

- `WorkerSettlement` records worker payout accounting for a period.
- Settlement status values are `Pending` and `Paid`.
- Settlements reference a worker and period range.
- Worker earnings must be calculated from eligible `SaleItem` records.
- Settlement calculations must not use `Sale.totalAmount` directly.
- Settlements do not physically move money by themselves.
- The future backend owns settlement approval, payout execution, and audit recording.

## Analytics Rules

- Top workers derive from `SaleItem.workerId`.
- Top services derive from `SaleItem.serviceId`.
- Worker earnings derive from `SaleItem.workerRevenue`.
- Service revenue derives from `SaleItem.unitPrice`, adjusted by item-level refunds when applicable.
- Sale-level totals can support gross revenue summaries, but they cannot answer attribution questions by worker or service.

## Audit Rules

The audit model must track:

- `SaleCreated`
- `RefundRequested`
- `RefundApproved`
- `SettlementPaid`

Audit entries should identify the affected entity, performer, branch, timestamp, and metadata. The backend will own audit creation rules.

## Sync Rules

- Sync status values are `Pending`, `Synced`, and `Failed`.
- Cloud database remains the source of truth.
- Offline queue is a fallback only.
- Offline-created payloads must be treated as temporary until accepted by the server.
- Server wins during conflicts.
- Client-side conflict state should be auditable, but correction workflows belong to a later backend-backed phase.

## DTO And Validation Boundary

- DTOs define request and response shapes.
- Zod schemas validate DTO and entity shape only.
- Zod schemas do not perform workflow orchestration.
- Cross-field decisions, authorization, payment lifecycle decisions, calculations, and persistence belong to the future backend.
