# Offline Sync Engine

MWANGI'Z Salon POS uses a SQLite outbox in Electron to protect cashier work during network loss.

```text
POS event
-> SQLite sync_outbox
-> queue processor
-> /api/sync/retry
-> event_store
-> backend processor
```

## Core Files

- `src/sync/outbox/outboxStore.ts`: SQLite outbox store.
- `src/sync/idempotency.ts`: deterministic idempotency key generation.
- `src/sync/networkDetector.ts`: Electron-safe online/offline detection.
- `src/sync/queueProcessor.ts`: batch retry processor with exponential backoff.
- `src/sync/syncEngine.ts`: orchestration layer.
- `src/sync/types.ts`: shared sync types.

## Behavior

Events are always stored locally first. When online, the queue processor sends due events in batches to `/api/sync/retry`. Events are ordered by local SQLite sequence, and later events for an aggregate are blocked if an older event for the same aggregate is not ready.

Failed events stay in SQLite and receive a retry time using exponential backoff with jitter. Synced events can be cleared with `clearSyncedEvents()`.

The backend remains the source of truth. If the server rejects an event, the outbox marks it failed and retries according to the configured retry policy; reconciliation remains server-wins.
