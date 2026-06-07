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
})
