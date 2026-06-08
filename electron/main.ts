import electronCommon from 'electron/common'
import electronMain from 'electron/main'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentFile = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFile)
const devServerUrl = process.env.VITE_DEV_SERVER_URL
const { shell } = electronCommon
const { app, BrowserWindow, ipcMain, nativeTheme } = electronMain

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
