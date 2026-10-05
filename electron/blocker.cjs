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
