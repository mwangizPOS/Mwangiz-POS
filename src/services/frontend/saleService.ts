import type { RequestRefundIntent, SubmitSaleIntent } from '@/sync/intents'

export const saleService = {
  async submitSale(intent: SubmitSaleIntent, branchId: string, actorId: string) {
    if ((window as any).mwangiPOS?.dispatchSubmitSale) {
      return (window as any).mwangiPOS.dispatchSubmitSale(intent, branchId, actorId)
    }
    console.warn('Sync engine is not available. Running in web mode.')
  },

  async requestRefund(intent: RequestRefundIntent, branchId: string, actorId: string) {
    if ((window as any).mwangiPOS?.dispatchRequestRefund) {
      return (window as any).mwangiPOS.dispatchRequestRefund(intent, branchId, actorId)
    }
    console.warn('Sync engine is not available. Running in web mode.')
  }
}
