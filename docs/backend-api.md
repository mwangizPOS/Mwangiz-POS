# Railway Backend API

MWANGI'Z Salon POS uses the Railway API as the only network entry point between the Electron POS, PostgreSQL event store, M-Pesa, and the backend event processor.

## Runtime Shape

```text
Electron POS
-> Express API
-> event_store + idempotency_keys
-> stateless event processor replay
-> projections handled by processor layer
```

The API does not expose CRUD endpoints and does not write projection tables directly. It validates events, persists append-only event records, and invokes the existing processor.

## Endpoints

### `GET /health`

Returns server, database, and event processor status.

### `POST /api/events`

Accepts a full event envelope. The endpoint validates the event with the shared Zod event schemas, rejects malformed input before storage, checks duplicate `event_id` or `idempotency_key`, appends new events to `event_store`, and marks the idempotency result as `Processed` or `Rejected`.

### `POST /api/mpesa/stk-push`

Accepts:

- `phone_number`
- `amount`
- `sale_id`
- `branch_id`
- `actor_id`
- `idempotency_key`

The API uses a PostgreSQL advisory lock around the idempotency key before calling Daraja. This prevents duplicate STK prompts across concurrent API instances.

### `POST /api/mpesa/callback`

Receives the Safaricom callback and responds `200 OK` immediately. Processing happens asynchronously after the response. Successful callbacks emit `PaymentCompleted`; failed callbacks are acknowledged but do not trust or finalize frontend payment state.

### `POST /api/sync/retry`

Accepts a delayed batch of event envelopes from the Electron offline queue. Events are processed sequentially in request order, with a per-event result grouped into `accepted`, `duplicates`, and `rejected`.

## Required Environment

- `DATABASE_URL`
- `BACKEND_API_KEY`
- `ELECTRON_APP_ORIGIN`
- `MPESA_ENV`
- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_SHORTCODE`
- `MPESA_PASSKEY`
- `MPESA_CALLBACK_URL`

Optional:

- `DATABASE_SSL`
- `MPESA_CALLBACK_SECRET`
- `MPESA_TRANSACTION_TYPE`

## Security Notes

Helmet is enabled globally. CORS is restricted by `ELECTRON_APP_ORIGIN` or `CORS_ORIGINS`. `/api/events`, `/api/sync/retry`, and `/api/mpesa/stk-push` require `x-api-key` or a bearer token. M-Pesa callback authentication uses `MPESA_CALLBACK_SECRET` when configured.
