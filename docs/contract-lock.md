# Contract Lock Layer

The contract lock layer freezes canonical names for events, entities, projections, and backend API actions.

## Files

- `src/contracts/registry.ts`: canonical registries.
- `src/contracts/mapping.ts`: backward compatibility mappings from legacy or alternate names.
- `src/contracts/validateRegistry.ts`: compile-time uniqueness helpers.

## Canonical Event Names

New contracts should use `EventTypeRegistry` values such as:

- `SALE_CREATED`
- `SALE_ITEM_CREATED`
- `PAYMENT_PROCESSED`
- `REFUND_APPLIED`
- `WORKER_SETTLEMENT_CALCULATED`
- `WORKER_SETTLEMENT_PAID`
- `AUDIT_LOG_CREATED`

Existing stored event names such as `RefundProcessed` are mapped through `LegacyToCanonicalEventTypeMapping` and should not be used for new contract design.

## Compatibility

The current event processor and PostgreSQL enum still use the existing PascalCase event names. `src/events/eventTypes.ts` now imports those legacy names from the mapping file instead of redefining strings locally. This prevents new drift while preserving database compatibility.
