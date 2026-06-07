# MWANGI'Z Salon POS Event Contracts

This document defines the contract and event system layer only. It does not define backend handlers, API routes, database migrations, SQL, UI, authentication logic, or M-Pesa implementation.

## Architecture Principle

MWANGI'Z Salon POS is sale-centric and event-first.

- A `Sale` represents one checkout and one receipt.
- A `Sale` contains one or more `SaleItem` records.
- A `SaleItem` represents one service performed by one worker.
- Financial attribution, worker earnings, and analytics derive from `SaleItem`.
- No `Transaction` model exists in the system.

System boundaries:

- Electron app: UI and offline outbox queue.
- Backend: validation, invariant enforcement, event processing, and projection updates.
- Cloud database: final state storage and projections.
- Event stream: source of change history and replayable system behavior.

## Event Envelope

Every event must use this envelope:

```ts
EventEnvelope {
  event_id: UUID
  event_type: string
  aggregate_id: string
  aggregate_type: 'Sale' | 'Worker' | 'Branch'
  branch_id: string
  timestamp: ISODateTime
  actor_id: string
  payload: StrictTypedObject
  version: number
  idempotency_key: string
}
```

Rules:

- Events are immutable.
- Events are append-only.
- Events are idempotent.
- Duplicate events must not cause duplicate processing.
- Every event must be replay-safe.
- `event_id` and `idempotency_key` must be unique enough for duplicate rejection.
- Event consumers must process events in order per aggregate.

## Domain Events

Sale events:

- `SaleCreated`
- `SaleCompleted`
- `SaleCancelled`

Sale item events:

- `SaleItemAdded`
- `SaleItemUpdated`
- `SaleItemRemoved`

Payment events:

- `PaymentInitiated`
- `PaymentCompleted`
- `SplitPaymentRecorded`

Refund events:

- `RefundRequested`
- `RefundApproved`
- `RefundRejected`
- `RefundProcessed`

Settlement events:

- `WorkerSettlementCalculated`
- `WorkerPaid`
- `WorkerSettlementMarkedPaid`

Audit event:

- `AuditLogCreated`

TypeScript definitions live in `src/events`.

## API Contract Shape

API DTOs are command contracts. They describe intent and expected event results, but do not implement behavior.

Sale flow:

- `CreateSaleRequest`
- `CreateSaleResponse`
- `AddSaleItemRequest`
- `AddSaleItemResponse`
- `CompleteSaleRequest`
- `CompleteSaleResponse`

Payment flow:

- `InitiatePaymentRequest`
- `InitiatePaymentResponse`
- `ConfirmPaymentRequest`
- `ConfirmPaymentResponse`
- `SplitPaymentRequest`
- `SplitPaymentResponse`

Refund flow:

- `CreateRefundRequest`
- `CreateRefundResponse`
- `ApproveRefundRequest`
- `ApproveRefundResponse`

Settlement flow:

- `CalculateSettlementRequest`
- `CalculateSettlementResponse`
- `MarkWorkerPaidRequest`
- `MarkWorkerPaidResponse`

Sync flow:

- `SyncQueueRequest`
- `SyncQueueResponse`
- `SyncEventBatchRequest`
- `SyncEventBatchResponse`

Contract definitions live in `src/contracts`.

## Offline Sync

Offline mode uses the outbox pattern.

Local sync event:

```ts
SyncEvent {
  local_id: string
  event_envelope: EventEnvelope
  status: 'Pending' | 'Synced' | 'Failed'
  retry_count: number
}
```

Flow:

```text
Electron UI
-> local outbox
-> batched sync request
-> backend event processor
-> cloud projections
-> sync acknowledgement
```

Rules:

- Events are queued locally first.
- Sync happens in batches.
- The server must be idempotent.
- The server must reject duplicates using `event_id` and `idempotency_key`.
- Failed events remain replayable.
- Server wins during conflicts.

## Business Invariants

The server must enforce:

1. Sale total equals the sum of all sale item prices.
2. Worker commission is calculated only from sale items.
3. Refund cannot exceed remaining refundable amount.
4. Split payments must equal `Sale.total_amount`.
5. Sale item must always belong to exactly one sale.
6. Every refund must reference a sale or sale item.
7. No orphan sale items are allowed.

These invariants are documented as contract constants in `src/contracts/invariants.ts`. They are not executed in this layer.

## Multi-Service Edge Case

A single sale can contain:

- multiple client labels
- multiple services
- multiple workers
- multiple sale items

It is still one sale, one receipt, and one payment event. Split tender is an internal accounting breakdown under the sale, not multiple real-world payments.

## Payment Rule

Supported tender methods:

- `Cash`
- `Mpesa`
- `Bank`
- `Mixed`

`Mixed` means the sale has a split payment breakdown. It does not mean multiple sales or multiple receipts.

## Analytics Rule

Analytics must derive from `SaleItem` as the primary source.

Use `SaleItem` for:

- top workers
- top services
- worker earnings
- service-level revenue
- settlement preparation

Do not use sale totals directly for worker or service attribution.

## Audit Rule

Sensitive actions must emit audit events:

- refund approval
- payment completion
- worker settlement payment
- price change
- service modification

Audit payloads must include:

- who performed the action
- what entity was affected
- when it happened
- where it happened, through `branch_id`
- relevant metadata

## Validation

Zod schemas live in `src/validation`.

Schemas validate:

- event envelopes
- event payload shape
- API request/response DTO shape
- sync queue DTO shape
- invariant contract shape

Schemas do not:

- calculate totals
- process events
- persist projections
- call payment providers
- enforce authorization
- perform conflict resolution
