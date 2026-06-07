# Authentication and Database Integration

MWANGI'Z Salon POS now separates API authentication, persistence, event processing, and projections into explicit layers.

## Authentication

- Access tokens are JWTs signed with `JWT_SECRET`.
- Refresh tokens are opaque random tokens. Only the token secret hash is stored.
- Passwords are hashed with `bcrypt`.
- Supported roles remain `SuperAdmin`, `BranchManager`, and `Cashier`.
- API routes can combine backend API key verification with JWT role checks.

Refresh-token persistence table:

```text
auth_refresh_tokens
- id
- user_id
- token_hash
- expires_at
- created_at
- revoked_at
- replaced_by_token_id
```

This task updates the reference `schema.sql`, but does not create a migration file. Apply the schema change through the normal Supabase/Railway database migration process before enabling login in a deployed environment.

## Database Layer

The database integration exposes:

- A PostgreSQL pool/client wrapper.
- Transaction helpers.
- Repository classes for event store, sales, sale items, refunds, settlements, workers, services, branches, users, and refresh tokens.

Repositories are persistence-only. They do not calculate commissions, refunds, totals, settlement balances, or sync decisions.

## Accepted Event Flow

```text
API
-> EventStoreRepository
-> EventProcessor
-> ProjectionEngine
-> PostgreSQL
```

The event store remains the replay source. Projections are derived state and must remain rebuildable from `event_store`.

## Deployment Notes

- `DATABASE_URL`, `DATABASE_SSL`, and Supabase environment variables must be configured before Railway deployment.
- `JWT_SECRET` must be a strong secret and must not be committed.
- Projection tables from `projections.sql` must exist before event ingestion runs projection updates.
- Initial users should be seeded through a controlled migration or admin bootstrap flow, not through UI.
