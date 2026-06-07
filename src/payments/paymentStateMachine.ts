import { PaymentStatus } from '@/domain/enums'
import { PaymentExecutionStatus } from './types'
import type { PaymentExecutionStatus as PaymentExecutionStatusType } from './types'

type TransitionMap = Record<PaymentExecutionStatusType, readonly PaymentExecutionStatusType[]>

const allowedTransitions: TransitionMap = {
  [PaymentExecutionStatus.PendingProvider]: [
    PaymentExecutionStatus.Processed,
    PaymentExecutionStatus.Failed,
    PaymentExecutionStatus.Rejected,
  ],
  [PaymentExecutionStatus.PendingSync]: [
    PaymentExecutionStatus.Processed,
    PaymentExecutionStatus.Failed,
    PaymentExecutionStatus.Rejected,
  ],
  [PaymentExecutionStatus.Processed]: [PaymentExecutionStatus.Duplicate],
  [PaymentExecutionStatus.Duplicate]: [],
  [PaymentExecutionStatus.Failed]: [
    PaymentExecutionStatus.PendingProvider,
    PaymentExecutionStatus.PendingSync,
  ],
  [PaymentExecutionStatus.Rejected]: [],
}

export function canTransitionPayment(
  from: PaymentExecutionStatusType,
  to: PaymentExecutionStatusType,
) {
  return allowedTransitions[from].includes(to)
}

export function assertPaymentTransition(
  from: PaymentExecutionStatusType,
  to: PaymentExecutionStatusType,
) {
  if (!canTransitionPayment(from, to)) {
    throw new Error(`Payment transition ${from} -> ${to} is not allowed.`)
  }
}

export function resolveExecutionStatusFromPaymentStatus(
  paymentStatus: PaymentStatus | undefined,
  pendingSync: boolean,
) {
  if (pendingSync) {
    return PaymentExecutionStatus.PendingSync
  }

  if (paymentStatus === PaymentStatus.Paid) {
    return PaymentExecutionStatus.Processed
  }

  if (paymentStatus === PaymentStatus.Failed) {
    return PaymentExecutionStatus.Failed
  }

  if (paymentStatus === PaymentStatus.Cancelled) {
    return PaymentExecutionStatus.Rejected
  }

  return PaymentExecutionStatus.PendingProvider
}

export function assertPaymentNotFinalized(paymentStatus: PaymentStatus | undefined) {
  if (
    paymentStatus === PaymentStatus.Paid ||
    paymentStatus === PaymentStatus.Refunded ||
    paymentStatus === PaymentStatus.PartiallyRefunded
  ) {
    throw new Error('Sale payment is already finalized.')
  }
}
