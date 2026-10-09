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
