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
