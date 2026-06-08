import { PaymentMethod, PaymentStatus } from '@/domain/enums'
import { resolveExecutionStatusFromPaymentStatus } from '@/payments/paymentStateMachine'
import { PaymentExecutionStatus } from '@/payments/types'
export type {
  CashierMpesaState,
  CashierPaymentMethod,
  CashierSaleClientDraft,
  CashierSaleDraft,
  CashierSaleItemDraft,
  CashierSplitMethod,
  CashierSplitPaymentDraft,
} from '@/types/cashier'
import type {
  CashierMpesaState,
  CashierPaymentMethod,
  CashierSaleClientDraft,
  CashierSplitMethod,
  CashierSplitPaymentDraft,
} from '@/types/cashier'

export const cashierPaymentMethods: CashierPaymentMethod[] = [
  'Cash',
  'Mpesa',
  'Bank',
  'Mixed',
]

export const cashierSplitMethods: CashierSplitMethod[] = ['Cash', 'Mpesa', 'Bank']

export function getPaymentMethodLabel(method: CashierPaymentMethod | CashierSplitMethod) {
  return method === 'Mpesa' ? 'M-Pesa' : method
}

export function toDomainPaymentMethod(method: CashierPaymentMethod): PaymentMethod {
  if (method === 'Mpesa') {
    return PaymentMethod.Mpesa
  }

  return PaymentMethod[method]
}

export function calculateClientTotals(clients: CashierSaleClientDraft[]) {
  return clients.map((client) => ({
    clientId: client.id,
    label: client.label,
    total: roundMoney(client.items.reduce((sum, item) => sum + sanitizeMoney(item.price), 0)),
  }))
}

export function calculateSaleTotal(clients: CashierSaleClientDraft[]) {
  return roundMoney(
    clients.reduce(
      (sum, client) =>
        sum + client.items.reduce((clientSum, item) => clientSum + sanitizeMoney(item.price), 0),
      0,
    ),
  )
}

export function validateMixedPaymentRows(
  rows: CashierSplitPaymentDraft[],
  saleTotal: number,
) {
  const normalizedRows = rows.map((row) => ({
    ...row,
    amount: sanitizeMoney(row.amount),
    reference: row.reference.trim(),
  }))
  const paidTotal = roundMoney(
    normalizedRows.reduce((sum, row) => sum + sanitizeMoney(row.amount), 0),
  )
  const runningBalance = roundMoney(saleTotal - paidTotal)
  const hasInvalidAmount = normalizedRows.some((row) => row.amount <= 0)
  const mpesaWithoutReference = normalizedRows.some(
    (row) => row.method === 'Mpesa' && row.amount > 0 && row.reference.length === 0,
  )
  const bankWithoutReference = normalizedRows.some(
    (row) => row.method === 'Bank' && row.amount > 0 && row.reference.length === 0,
  )
  const isBalanced = Math.abs(runningBalance) < 0.01

  return {
    paidTotal,
    runningBalance,
    isBalanced,
    isValid:
      rows.length > 0 &&
      saleTotal > 0 &&
      isBalanced &&
      !hasInvalidAmount &&
      !mpesaWithoutReference &&
      !bankWithoutReference,
    message: resolveMixedPaymentMessage({
      rows,
      saleTotal,
      hasInvalidAmount,
      mpesaWithoutReference,
      bankWithoutReference,
      runningBalance,
    }),
  }
}

export function getCashierPaymentExecutionStatus(input: {
  method: CashierPaymentMethod
  offlineMode: boolean
  mpesaState: CashierMpesaState
  readyToComplete: boolean
}) {
  if (input.method === 'Mpesa') {
    if (input.offlineMode) {
      return resolveExecutionStatusFromPaymentStatus(PaymentStatus.Pending, true)
    }

    if (input.mpesaState === 'success') {
      return resolveExecutionStatusFromPaymentStatus(PaymentStatus.Paid, false)
    }

    if (input.mpesaState === 'failed') {
      return resolveExecutionStatusFromPaymentStatus(PaymentStatus.Failed, false)
    }

    return PaymentExecutionStatus.PendingProvider
  }

  if (input.readyToComplete) {
    return resolveExecutionStatusFromPaymentStatus(PaymentStatus.Paid, false)
  }

  return PaymentExecutionStatus.PendingProvider
}

export function getExecutionStatusLabel(status: PaymentExecutionStatus) {
  switch (status) {
    case PaymentExecutionStatus.PendingProvider:
      return 'Pending provider'
    case PaymentExecutionStatus.PendingSync:
      return 'Pending sync'
    case PaymentExecutionStatus.Processed:
      return 'Ready to complete'
    case PaymentExecutionStatus.Duplicate:
      return 'Duplicate'
    case PaymentExecutionStatus.Failed:
      return 'Failed'
    case PaymentExecutionStatus.Rejected:
      return 'Rejected'
  }
}

export function validateCashierPayment(input: {
  method: CashierPaymentMethod
  saleTotal: number
  offlineMode: boolean
  mpesaState: CashierMpesaState
  manualMpesaReference: string
  bankReference: string
  mixedPaymentValid: boolean
}) {
  if (input.saleTotal <= 0) {
    return { canComplete: false, message: 'Add at least one service before payment.' }
  }

  if (input.method === 'Cash') {
    return { canComplete: true, message: 'Cash payment is ready.' }
  }

  if (input.method === 'Bank') {
    const canComplete = input.bankReference.trim().length > 0
    return {
      canComplete,
      message: canComplete ? 'Bank reference captured.' : 'Enter a bank reference.',
    }
  }

  if (input.method === 'Mpesa') {
    if (input.offlineMode) {
      const canComplete = input.manualMpesaReference.trim().length > 0
      return {
        canComplete,
        message: canComplete
          ? 'Manual M-Pesa reference captured for sync.'
          : 'Enter the manual M-Pesa receipt number.',
      }
    }

    const canComplete = input.mpesaState === 'success'
    return {
      canComplete,
      message: canComplete ? 'STK payment confirmed.' : 'Wait for successful STK confirmation.',
    }
  }

  return {
    canComplete: input.mixedPaymentValid,
    message: input.mixedPaymentValid
      ? 'Mixed payment is balanced.'
      : 'Mixed payment rows must equal the sale total.',
  }
}

export function sanitizeMoney(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function resolveMixedPaymentMessage(input: {
  rows: CashierSplitPaymentDraft[]
  saleTotal: number
  hasInvalidAmount: boolean
  mpesaWithoutReference: boolean
  bankWithoutReference: boolean
  runningBalance: number
}) {
  if (input.saleTotal <= 0) {
    return 'Add services before split payment.'
  }

  if (input.rows.length === 0) {
    return 'Add at least one payment row.'
  }

  if (input.hasInvalidAmount) {
    return 'Each payment row must be greater than zero.'
  }

  if (input.mpesaWithoutReference) {
    return 'M-Pesa split rows need a manual receipt reference.'
  }

  if (input.bankWithoutReference) {
    return 'Bank split rows need a reference.'
  }

  if (Math.abs(input.runningBalance) >= 0.01) {
    return input.runningBalance > 0
      ? `Remaining balance: ${formatMoney(input.runningBalance)}`
      : `Overpaid by ${formatMoney(Math.abs(input.runningBalance))}`
  }

  return 'Split payment matches the sale total.'
}

export function formatMoney(amount: number) {
  return `KES ${roundMoney(amount).toLocaleString()}`
}
