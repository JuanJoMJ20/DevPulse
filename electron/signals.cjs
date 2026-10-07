const { powerMonitor } = require('electron')
const { createForegroundReader } = require('./foreground.cjs')

const POLL_MS = 1000
const EMIT_MS = 2000
const ACTIVE_IDLE_SEC = 60 // menos de 1 min inactivo = estás trabajando

/** Umbrales con los que la actividad se convierte en factores de 0 a 1 */
const THRESHOLDS = {
  windowMs: 5 * 60_000, // ventana de análisis
  breakSec: 5 * 60, // inactividad que cuenta como pausa real
  switchFloor: 1, // cambios de app por minuto que se consideran normales
  switchSpan: 5,
  noBreakFrom: 25, // minutos sin pausa a partir de los que empieza a pesar
  noBreakSpan: 65,
  minKeys: 40,
  smoothing: 0.12,
}

const clamp01 = (n) => Math.min(1, Math.max(0, n))
const today = () => new Date().toLocaleDateString('sv') // YYYY-MM-DD local
const prune = (arr, since) => {
  while (arr.length && arr[0] < since) arr.shift()
}

/**
 * Captura de tecleo global. Solo guarda la HORA de cada pulsación y si fue
 * una corrección (Retroceso/Suprimir). Nunca guarda qué tecla se pulsó.
 */
function startKeyboard(onKey) {
