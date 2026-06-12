import electronCommon from 'electron/common'
import electronMain from 'electron/main'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentFile = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFile)
const devServerUrl = process.env.VITE_DEV_SERVER_URL
const { shell } = electronCommon
const { app, BrowserWindow, ipcMain, nativeTheme } = electronMain
import { syncEngine } from '../src/sync/syncEngine.js'

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1180,
    minHeight: 720,
    title: "MWANGI'Z Salon POS",
    backgroundColor: '#0B0F14',
    show: false,
    webPreferences: {
      preload: path.join(currentDirectory, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
    return
  }

  void mainWindow.loadFile(path.join(currentDirectory, '../dist/index.html'))
}

app.whenReady().then(() => {
  ipcMain.handle('app:get-version', () => app.getVersion())
  ipcMain.handle('theme:get-system', () => (nativeTheme.shouldUseDarkColors ? 'dark' : 'light'))

  ipcMain.handle('sync:dispatchSubmitSale', async (_, intent, branchId, actorId) => {
    return syncEngine.dispatchSubmitSale(intent, branchId, actorId)
  })
  ipcMain.handle('sync:dispatchRequestRefund', async (_, intent, branchId, actorId) => {
    return syncEngine.dispatchRequestRefund(intent, branchId, actorId)
  })
  ipcMain.handle('sync:dispatchApproveRefund', async (_, intent, branchId, actorId) => {
    return syncEngine.dispatchApproveRefund(intent, branchId, actorId)
  })
  ipcMain.handle('sync:dispatchRejectRefund', async (_, intent, branchId, actorId) => {
    return syncEngine.dispatchRejectRefund(intent, branchId, actorId)
  })

  syncEngine.start()

  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
