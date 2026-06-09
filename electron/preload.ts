import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('mwangiPOS', {
  platform: process.platform,
  versions: {
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    node: process.versions.node,
  },
  getAppVersion: () => ipcRenderer.invoke('app:get-version') as Promise<string>,
  getSystemTheme: () => ipcRenderer.invoke('theme:get-system') as Promise<'dark' | 'light'>,
  dispatchSubmitSale: (intent: any, branchId: string, actorId: string) => ipcRenderer.invoke('sync:dispatchSubmitSale', intent, branchId, actorId),
  dispatchRequestRefund: (intent: any, branchId: string, actorId: string) => ipcRenderer.invoke('sync:dispatchRequestRefund', intent, branchId, actorId),
  dispatchApproveRefund: (intent: any, branchId: string, actorId: string) => ipcRenderer.invoke('sync:dispatchApproveRefund', intent, branchId, actorId),
  dispatchRejectRefund: (intent: any, branchId: string, actorId: string) => ipcRenderer.invoke('sync:dispatchRejectRefund', intent, branchId, actorId),
})
