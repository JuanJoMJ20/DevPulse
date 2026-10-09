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
  try {
    const { uIOhook, UiohookKey } = require('uiohook-napi')
    const corrections = new Set([UiohookKey.Backspace, UiohookKey.Delete])
    uIOhook.on('keydown', (e) => onKey(corrections.has(e.keycode)))
    uIOhook.start()
    return { ok: true, stop: () => uIOhook.stop() }
  } catch {
    return { ok: false, stop: () => {} }
  }
}

/**
 * Convierte la actividad del PC en cuatro factores (0–1) y deja que el modelo
 * personal (model.cjs) decida cuánto pesa cada uno en la carga final.
 */
function startSignals(store, model, emit) {
  const readForeground = createForegroundReader()

  const keys = []
  const corrections = []
  const switches = []
  let lastExe = null
  let lastApp = null
  let streakStart = null
  let load = 20
  let factors = { fragmentation: 0, noBreak: 0, corrections: 0, rhythm: 0 }

  const stats = store.get('stats') ?? {}
  const todayStats = () => (stats[today()] ??= { activeSeconds: 0, switches: 0 })

  const keyboard = startKeyboard((isCorrection) => {
    const now = Date.now()
    keys.push(now)
    if (isCorrection) corrections.push(now)
  })

  const poll = setInterval(() => {
    const now = Date.now()
    const idle = powerMonitor.getSystemIdleTime()

    if (idle < ACTIVE_IDLE_SEC) todayStats().activeSeconds += POLL_MS / 1000
    if (idle >= THRESHOLDS.breakSec) streakStart = null
    else if (streakStart === null) streakStart = now

    const fg = readForeground()
    if (fg && fg.exe) {
      lastApp = fg
      if (lastExe && fg.exe !== lastExe) {
        switches.push(now)
        todayStats().switches += 1
      }
      lastExe = fg.exe
    }
  }, POLL_MS)

  const compute = setInterval(() => {
    const p = THRESHOLDS
    const now = Date.now()
    prune(keys, now - p.windowMs)
    prune(corrections, now - p.windowMs)
    prune(switches, now - p.windowMs)


    const idleSec = powerMonitor.getSystemIdleTime()
    const switchesPerMin = switches.length / (p.windowMs / 60_000)
    const continuousMin = streakStart ? (now - streakStart) / 60_000 : 0
    const kpm = keys.filter((t) => t > now - 60_000).length
    const correctionRatio = keys.length >= p.minKeys ? corrections.length / keys.length : 0

    // Irregularidad del ritmo: coeficiente de variación entre pulsaciones dentro de ráfagas
    const gaps = []
    for (let i = 1; i < keys.length; i++) {
      const gap = keys[i] - keys[i - 1]
      if (gap < 2000) gaps.push(gap)
    }
    let rhythmCv = 0
    if (gaps.length >= p.minKeys - 10) {
      const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length
      const sd = Math.sqrt(gaps.reduce((a, g) => a + (g - mean) ** 2, 0) / gaps.length)
      rhythmCv = sd / mean
    }

    factors = {
      fragmentation: clamp01((switchesPerMin - p.switchFloor) / p.switchSpan),
      noBreak: clamp01((continuousMin - p.noBreakFrom) / p.noBreakSpan),
      corrections: clamp01((correctionRatio - 0.06) / 0.14), // >20 % de correcciones = máxima
      rhythm: clamp01((rhythmCv - 0.7) / 0.8),
    }

    let target = 100 * model.predict(factors)
    if (idleSec > 120) target *= 0.3 // estás descansando

    load += (target - load) * p.smoothing // suavizado para que el layout no reaccione a picos sueltos

    store.set('stats', stats)

    const t = todayStats()
    emit({
      load: Math.round(load),
      factors,
      switchesPerMin: Math.round(switchesPerMin * 10) / 10,
      continuousMin: Math.round(continuousMin * 10) / 10,
      kpm,
      correctionRatio: Math.round(correctionRatio * 100) / 100,
      idleSec,
      keyboard: keyboard.ok,
      activeApp: lastApp ? { exe: lastApp.exe, title: lastApp.title } : null,
      today: { activeMinutes: Math.round(t.activeSeconds / 60), switches: t.switches },
      model: model.summary(),
    })
  }, EMIT_MS)

  return {
    currentFactors: () => factors,
    stop() {
      clearInterval(poll)
      clearInterval(compute)
      keyboard.stop()
    },
  }
}

module.exports = { startSignals }
