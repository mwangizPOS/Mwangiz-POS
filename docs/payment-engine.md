# Payment Execution Layer

The payment execution layer coordinates payment commands for a Sale without changing the domain model, database schema, sync engine, or event contracts.

## Scope

Supported flows:

- Cash
- Bank
- M-Pesa online STK Push
- M-Pesa offline manual entry
- Mixed / split payments

Payment still belongs to `Sale`, not `Transaction`. A Sale can contain multiple clients, services, and workers, but it has one payment execution flow and one receipt.

## Files

- `src/payments/paymentOrchestrator.ts`
- `src/payments/paymentStateMachine.ts`
- `src/payments/splitPayments.ts`
- `src/payments/types.ts`
- `src/payments/mpesa/stkPush.ts`
- `src/payments/mpesa/callbackHandler.ts`

## Event Compatibility

The layer emits existing events only:

- `PaymentInitiated`
- `PaymentCompleted`
- `SplitPaymentRecorded`

The contract registry canonical name for completed payment is `PAYMENT_PROCESSED`, mapped to the existing `PaymentCompleted` event name for database compatibility.

## Online M-Pesa

```text
Cashier selects M-Pesa
-> PaymentOrchestrator.initiateOnlineMpesa()
-> branch credentials provider loads shortcode/passkey/till
-> Daraja STK Push
-> PaymentInitiated event
-> callback handler verifies callback
-> PaymentCompleted event
-> backend processor finalizes Sale
```

The Daraja application credentials are global, while branch shortcode, passkey, till number, and enabled flag are loaded dynamically per Sale branch.

## Offline Manual M-Pesa

When network is unavailable, STK Push is not attempted.

The cashier must enter:

- phone number
- receipt number
- amount

The layer creates a `PaymentCompleted` event locally and queues it through the sync engine. The local execution status is `PENDING_SYNC` until the backend accepts the event. The server remains the source of truth.

## Split Payments

Mixed payments emit:

1. `PaymentInitiated` with method `Mixed`
2. `SplitPaymentRecorded`
3. `PaymentCompleted` with method `Mixed`

Current event contracts do not represent partial provider lifecycle callbacks inside a split payment. Therefore M-Pesa inside a mixed payment must be manual with a receipt reference until a future event contract adds provider-level split component events.

## Idempotency

Payment events use deterministic idempotency keys based on:

- sale id
- event type
- timestamp
- payload hash

Callers should preserve `requestedAt` or pass `idempotencyKey` when retrying a payment command. Online STK Push also runs under an idempotency guard to prevent duplicate prompts within the execution process.

## Security

The layer assumes HTTPS termination at Railway or the deployment edge.

Security hooks included:

- API-key-ready publisher boundary
- JWT-ready actor context through `actorId`
- M-Pesa callback signature validation
- request signature support through `x-mpesa-signature`, `x-mwangi-signature`, or `x-request-signature`
- no secrets in source code

## Required Configuration

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `BACKEND_API_KEY`
- `DARAJA_CONSUMER_KEY`
- `DARAJA_CONSUMER_SECRET`
- `CALLBACK_BASE_URL`
- `JWT_SECRET`
- `SYNC_BATCH_SIZE`
- `SYNC_RETRY_LIMIT`
- `SYNC_RETRY_DELAY`
