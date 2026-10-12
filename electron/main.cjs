const fs = require('node:fs')
const path = require('node:path')
const { app, BrowserWindow, ipcMain, Notification, shell } = require('electron')
const { createAuth } = require('./auth.cjs')
const { createStore } = require('./store.cjs')
const { startSignals } = require('./signals.cjs')
const { createBlocker } = require('./blocker.cjs')
const { createModel } = require('./model.cjs')

const DEV_URL = 'http://localhost:5180'

// Colores de la ventana nativa (fondo y botones de la barra de título) por tema
const WINDOW_THEME = {
  dark: { background: '#05070b', overlay: { color: '#05070b', symbolColor: '#a3b0c2', height: 36 } },
  light: { background: '#f4f6f9', overlay: { color: '#f4f6f9', symbolColor: '#475569', height: 36 } },
}
const prefsFile = () => path.join(app.getPath('userData'), 'window.json')

function readSavedTheme() {
  try {
    const { theme } = JSON.parse(fs.readFileSync(prefsFile(), 'utf8'))
    return theme === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}
const LEGACY_DATA = 'devpulse-data.json' // datos de antes de que existieran cuentas

if (!app.requestSingleInstanceLock()) app.quit()

app.setAppUserModelId('com.devpulse.app')

let win = null
let auth = null
let blocker = null
// Sesión activa: solo existe con una cuenta iniciada. Sin sesión no se mide nada.
let session = null

const send = (channel, payload) => {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload)
}

function startSession(user, { adoptLegacy = false } = {}) {
  endSession()
  const dir = app.getPath('userData')
  const file = auth.dataFileFor(user.id)
  const legacy = path.join(dir, LEGACY_DATA)
  if (adoptLegacy && fs.existsSync(legacy) && !fs.existsSync(path.join(dir, file))) fs.renameSync(legacy, path.join(dir, file))

  const store = createStore(dir, file)
  const model = createModel(store)
  const signals = startSignals(store, model, (payload) => send('signals', payload))
  session = { user, store, model, signals }
}

function endSession() {
  if (!session) return
  session.signals.stop()
  blocker.configure({ armed: false, apps: [] })
  try {
    session.store.flush()
  } catch {
    // si el disco falla al cerrar no hay a quién avisar
  }
  session = null
}

function createWindow() {
  const theme = WINDOW_THEME[readSavedTheme()]
  win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: theme.background,
    title: 'DevPulse',
    show: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: theme.overlay,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.once('ready-to-show', () => win.show())

  // Los enlaces externos se abren en el navegador, nunca dentro de la app
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (app.isPackaged) win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  else win.loadURL(DEV_URL)
}

app.whenReady().then(() => {
  auth = createAuth(app.getPath('userData'))
  blocker = createBlocker((event) => send('blocker:event', event))

  // ── Cuentas
  ipcMain.handle('auth:status', () => {
    const status = auth.status()
    if (status.user && session?.user.id !== status.user.id) startSession(status.user)
    return status
  })
  ipcMain.handle('auth:register', (_e, form) => {
    const result = auth.register(form)
    if (result.ok) startSession(result.user, { adoptLegacy: result.isFirst })
    return result
  })
  ipcMain.handle('auth:login', (_e, form) => {
    const result = auth.login(form)
    if (result.ok) startSession(result.user)
    return result
  })
  ipcMain.handle('auth:logout', () => {
    endSession()
    auth.logout()
    return true
  })

  // ── Datos de la cuenta activa
  ipcMain.handle('store:get', (_e, key) => session?.store.get(key))
  ipcMain.handle('store:set', (_e, key, value) => {
    if (!session) return false
    try {
      session.store.set(key, value)
      return true
    } catch {
      return false
    }
  })

  ipcMain.on('theme:set', (_e, name) => {
    const theme = WINDOW_THEME[name === 'light' ? 'light' : 'dark']
    if (win && !win.isDestroyed()) {
      win.setBackgroundColor(theme.background)
      win.setTitleBarOverlay(theme.overlay)
    }
    try {
      fs.writeFileSync(prefsFile(), JSON.stringify({ theme: name === 'light' ? 'light' : 'dark' }))
    } catch {
      // si no se puede guardar, la ventana arrancará oscura y se corregirá al cargar
    }
  })

  ipcMain.on('notify', (_e, { title, body }) => {
    if (Notification.isSupported()) new Notification({ title, body, silent: false }).show()
  })

  ipcMain.on('blocker:configure', (_e, config) => {
    if (session) blocker.configure(config)
  })

  ipcMain.handle('model:checkin', (_e, rating) => session?.model.checkIn(rating, session.signals.currentFactors()))
  ipcMain.handle('model:reset', () => session?.model.reset())

  createWindow()
})

app.on('second-instance', () => {
  if (!win) return
  if (win.isMinimized()) win.restore()
  win.focus()
})

app.on('window-all-closed', () => app.quit())

app.on('before-quit', () => {
  endSession()
  blocker?.stop()
})
