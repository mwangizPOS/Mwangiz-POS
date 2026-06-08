export type CashierPaymentMethod = 'Cash' | 'Mpesa' | 'Bank' | 'Mixed'
export type CashierSplitMethod = Exclude<CashierPaymentMethod, 'Mixed'>
export type CashierMpesaState = 'idle' | 'sending' | 'success' | 'failed'

export type CashierSaleItemDraft = {
  id: string
  serviceId: string
  workerId: string
  price: number
}

export type CashierSaleClientDraft = {
  id: string
  label: string
  items: CashierSaleItemDraft[]
}

export type CashierSplitPaymentDraft = {
  id: string
  method: CashierSplitMethod
  amount: number
  reference: string
}

export type CashierSaleDraft = {
  id: string
  saleNumber: string
  clients: CashierSaleClientDraft[]
  createdAt: string
  updatedAt: string
}
