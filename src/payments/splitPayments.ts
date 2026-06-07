import { v4 as uuidv4 } from 'uuid'
import { PaymentMethod } from '@/domain/enums'
import { EventAggregateType, EventType, type SplitPaymentRecordedEvent } from '@/events'
import { generateIdempotencyKey } from '@/sync'
import type { EntityId, MoneyAmount } from '@/types/primitives'
import type { MixedPaymentRequest, SplitPaymentComponent } from './types'

export function normalizeSplitComponents(components: SplitPaymentComponent[]) {
  const totals = new Map<Exclude<PaymentMethod, 'Mixed'>, SplitPaymentComponent>()

  for (const component of components) {
    if (component.amount <= 0) {
      throw new Error('Split payment component amount must be greater than zero.')
    }

    const existing = totals.get(component.method)

    totals.set(component.method, {
      ...component,
      amount: roundMoney((existing?.amount ?? 0) + component.amount),
      reference: component.reference ?? existing?.reference ?? null,
      phoneNumber: component.phoneNumber ?? existing?.phoneNumber ?? null,
    })
  }

  return [...totals.values()]
}

export function validateSplitPaymentTotal(
  components: SplitPaymentComponent[],
  saleTotal: MoneyAmount,
) {
  const total = roundMoney(components.reduce((sum, component) => sum + component.amount, 0))

  if (total !== roundMoney(saleTotal)) {
    throw new Error('Split payment total must equal sale total.')
  }

  return total
}

export function assertSplitPaymentCanUseExistingEvents(components: SplitPaymentComponent[]) {
  const mpesaComponent = components.find((component) => component.method === PaymentMethod.Mpesa)

  if (mpesaComponent && !mpesaComponent.reference) {
    throw new Error(
      'Mixed payments with M-Pesa require a manual receipt reference under current event contracts.',
    )
  }
}

export function createSplitPaymentRecordedEvent(input: {
  request: MixedPaymentRequest
  branchId: EntityId
  timestamp: string
  splitPaymentId?: EntityId
}) {
  const splitPaymentId = input.splitPaymentId ?? uuidv4()
  const components = normalizeSplitComponents(input.request.components)
  const amount = validateSplitPaymentTotal(components, input.request.amount)

  assertSplitPaymentCanUseExistingEvents(components)

  const payload = {
    saleId: input.request.saleId,
    splitPaymentId,
    amount,
    components: components.map((component) => ({
      method: component.method,
      amount: component.amount,
    })),
  }

  return {
    event_id: uuidv4(),
    event_type: EventType.SplitPaymentRecorded,
    aggregate_id: input.request.saleId,
    aggregate_type: EventAggregateType.Sale,
    branch_id: input.branchId,
    actor_id: input.request.actorId,
    payload,
    version: 1,
    timestamp: input.timestamp,
    idempotency_key: generateIdempotencyKey({
      saleId: input.request.saleId,
      eventType: EventType.SplitPaymentRecorded,
      timestamp: input.timestamp,
      payload,
    }),
  } satisfies SplitPaymentRecordedEvent
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
