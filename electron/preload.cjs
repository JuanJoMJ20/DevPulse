const { contextBridge, ipcRenderer } = require('electron')

function subscribe(channel, cb) {
  const handler = (_event, payload) => cb(payload)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

contextBridge.exposeInMainWorld('devpulse', {
  auth: {
    status: () => ipcRenderer.invoke('auth:status'),
    register: (form) => ipcRenderer.invoke('auth:register', form),
    login: (form) => ipcRenderer.invoke('auth:login', form),
    logout: () => ipcRenderer.invoke('auth:logout'),
  },
  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
  },
  onSignals: (cb) => subscribe('signals', cb),
  model: {
    checkIn: (rating) => ipcRenderer.invoke('model:checkin', rating),
    reset: () => ipcRenderer.invoke('model:reset'),
  },
  blocker: {
    configure: (config) => ipcRenderer.send('blocker:configure', config),
    onEvent: (cb) => subscribe('blocker:event', cb),
  },
  notify: (title, body) => ipcRenderer.send('notify', { title, body }),
  setTheme: (theme) => ipcRenderer.send('theme:set', theme),
})
