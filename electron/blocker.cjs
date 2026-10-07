const { execFile } = require('node:child_process')

const SCAN_MS = 4000
// Procesos que nunca se cierran, aunque alguien los añada a la lista
const PROTECTED = new Set(['devpulse.exe', 'electron.exe', 'explorer.exe', 'csrss.exe', 'winlogon.exe', 'svchost.exe'])

const run = (cmd, args) =>
  new Promise((resolve) => {
    execFile(cmd, args, { windowsHide: true }, (error, stdout, stderr) => resolve({ error, stdout, stderr }))
  })

async function runningProcesses() {
  const { stdout } = await run('tasklist', ['/fo', 'csv', '/nh'])
  const names = new Set()
  for (const line of stdout.split(/\r?\n/)) {
    const m = line.match(/^"([^"]+)"/)
    if (m) names.add(m[1].toLowerCase())
  }
  return names
}

/**
 * Bloqueador de contexto: mientras está armado, cierra las apps de la lista.
 * Primero pide el cierre normal (la app puede guardar); si sigue abierta en
 * el siguiente escaneo, la fuerza.
 */
function createBlocker(emit) {
  let config = { armed: false, apps: [] }
  let timer = null
  let scanning = false
  const askedToClose = new Set()

  async function scan() {
    if (scanning || !config.armed || process.platform !== 'win32') return
    scanning = true
    try {
      const running = await runningProcesses()
      for (const app of config.apps) {
        const exe = app.process.toLowerCase()
        if (PROTECTED.has(exe)) continue
        if (!running.has(exe)) {
          askedToClose.delete(exe)
          continue
        }
        const force = askedToClose.has(exe)
        const args = force ? ['/im', app.process, '/t', '/f'] : ['/im', app.process, '/t']
        const { error, stderr } = await run('taskkill', args)
        if (!force) {
          askedToClose.add(exe)
          if (!error) emit({ type: 'closed', app: app.name })
        } else if (error) {
          const denied = /acceso denegado|access is denied/i.test(stderr)
          emit({ type: 'failed', app: app.name, reason: denied ? 'denied' : 'unknown' })
          askedToClose.delete(exe)
        } else {
          emit({ type: 'closed', app: app.name })
          askedToClose.delete(exe)
        }
      }
    } finally {
      scanning = false
    }
  }

  return {
    configure(next) {
      config = next
      clearInterval(timer)
      askedToClose.clear()
      if (config.armed) {
        void scan()
        timer = setInterval(scan, SCAN_MS)
      }
    },
    stop() {
      clearInterval(timer)
    },
  }
}

module.exports = { createBlocker }
