export interface ApproveRefundIntent {
  refundId: string
  saleId: string
  approvedBy: string
}

export interface RejectRefundIntent {
  refundId: string
  saleId: string
  rejectedBy: string
  rejectionReason: string
}

export const managerService = {
  async approveRefund(intent: ApproveRefundIntent, branchId: string, actorId: string) {
    if ((window as any).mwangiPOS?.dispatchApproveRefund) {
      return (window as any).mwangiPOS.dispatchApproveRefund(intent, branchId, actorId)
    }
    console.warn('Sync engine is not available. Running in web mode.')
  },

  async rejectRefund(intent: RejectRefundIntent, branchId: string, actorId: string) {
    if ((window as any).mwangiPOS?.dispatchRejectRefund) {
      return (window as any).mwangiPOS.dispatchRejectRefund(intent, branchId, actorId)
    }
    console.warn('Sync engine is not available. Running in web mode.')
  }
}
