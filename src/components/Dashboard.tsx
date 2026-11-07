import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { HIDDEN_COUNT, LAYOUTS, WIDGET_ORDER } from '../config/layout'
import { tourSteps } from '../config/tour'
import { usePersistentState } from '../hooks/usePersistentState'
import { useStressEngine } from '../hooks/useStressEngine'
import { dayKey, uid } from '../lib/time'
import {
  DEFAULT_SETTINGS,
  type ActivityEvent,
  type BlockedApp,
  type BlockerEvent,
  type BlockerState,
  type FocusLog,
  type HumanErrorContent,
  type ModelSummary,
  type Settings,
  type StressLevel,
  type Task,
  type User,
  type WidgetId,
} from '../types'
import { CheckInPrompt } from './CheckInPrompt'
import { ConfirmDialog } from './Dialog'
import { HumanError } from './HumanError'
import { Logo } from './LoginScreen'
import { SettingsDialog } from './SettingsDialog'
import { StressControl } from './StressControl'
import { ThemeToggle } from './ThemeToggle'
import { Tutorial } from './Tutorial'
import { UndoToast } from './UndoToast'
import { UserMenu } from './UserMenu'
import { ActiveCodePanel } from './widgets/ActiveCodePanel'
import { ContextBlocker } from './widgets/ContextBlocker'
import { DeepWorkHeatmap } from './widgets/DeepWorkHeatmap'
import { MetricsPanel } from './widgets/MetricsPanel'
import { ModelPanel, RATINGS } from './widgets/ModelPanel'
import { NotificationsPanel } from './widgets/NotificationsPanel'
import { PomodoroWidget, type Mode } from './widgets/PomodoroWidget'

const MAX_EVENTS = 40

const DEFAULT_BLOCKER: BlockerState = {
  armed: false,
  closedByDay: {},
  apps: [
    { id: 'slack', name: 'Slack', process: 'slack.exe', blocked: true },
    { id: 'discord', name: 'Discord', process: 'Discord.exe', blocked: true },
    { id: 'whatsapp', name: 'WhatsApp', process: 'WhatsApp.exe', blocked: true },
    { id: 'telegram', name: 'Telegram', process: 'Telegram.exe', blocked: false },
    { id: 'steam', name: 'Steam', process: 'steam.exe', blocked: false },
  ],
}

const SAVE_ERROR: HumanErrorContent = {
  what: 'No pude guardar tus cambios',
  why: 'El disco no respondió cuando intenté escribir tus datos.',
  next: 'Comprueba que queda espacio libre. Lo que ves sigue aquí mientras la app esté abierta.',
}

const blockerError = (app: string, reason: 'denied' | 'unknown'): HumanErrorContent => ({
  what: `No pude cerrar ${app}`,
  why:
    reason === 'denied'
      ? 'Windows no me deja cerrarla, probablemente porque se abrió con permisos de administrador.'
      : `${app} no respondió a la petición de cierre.`,
  next: `Ciérrala tú desde la bandeja del sistema, o desactívala en el Bloqueador si la necesitas ahora.`,
})

/** Inserta un elemento de vuelta en su posición original (para deshacer) */
const insertAt = <T,>(list: T[], index: number, item: T) => [...list.slice(0, index), item, ...list.slice(index)]

type ViewTransitionDoc = Document & { startViewTransition?: (cb: () => void) => unknown }

/**
 * Aplica el nuevo layout dentro de una View Transition para que la retícula
 * se transforme de forma fluida en lugar de saltar.
 */
function useTransitionedLevel(level: StressLevel) {
  const [shown, setShown] = useState(level)
  useEffect(() => {
    if (level === shown) return
    const doc = document as ViewTransitionDoc
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (doc.startViewTransition && !reduceMotion) doc.startViewTransition(() => flushSync(() => setShown(level)))
    else setShown(level)
  }, [level, shown])
  return shown
}

interface DashboardProps {
  user: User
  /** Recién registrado: el tutorial se abre solo */
  isNewUser: boolean
  onSignOut: () => void
}

export function Dashboard({ user, isNewUser, onSignOut }: DashboardProps) {
  const engine = useStressEngine()
  // Durante el tutorial se muestran todos los paneles, sea cual sea la carga
  const [tourOpen, setTourOpen] = useState(false)
  const level = useTransitionedLevel(tourOpen ? 'low' : engine.level)
  const layout = LAYOUTS[level]
  const isFocus = level === 'high'
  const today = dayKey()

  const [error, setError] = useState<HumanErrorContent | null>(null)
  const onSaveError = useCallback(() => setError(SAVE_ERROR), [])

  const [task, setTask, r1] = usePersistentState<Task | null>('task', null, onSaveError)
  const [queue, setQueue, r2] = usePersistentState<Task[]>('queue', [], onSaveError)
  const [focusLog, setFocusLog, r3] = usePersistentState<FocusLog>('focusLog', {}, onSaveError)
  const [sessions, setSessions, r4] = usePersistentState<Record<string, number>>('sessions', {}, onSaveError)
  const [blocker, setBlocker, r5] = usePersistentState<BlockerState>('blocker', DEFAULT_BLOCKER, onSaveError)
  const [notes, setNotes, r6] = usePersistentState('notes', '', onSaveError)
  const [events, setEvents, r7] = usePersistentState<ActivityEvent[]>('events', [], onSaveError)
  const [tutorialSeen, setTutorialSeen, r8] = usePersistentState('tutorialSeen', false, onSaveError)
  const [storedSettings, setSettings, r9] = usePersistentState<Settings>('settings', DEFAULT_SETTINGS, onSaveError)
  const ready = r1 && r2 && r3 && r4 && r5 && r6 && r7 && r8 && r9
  // Cuentas creadas antes de existir algún ajuste reciben su valor por defecto
  const settings = { ...DEFAULT_SETTINGS, ...storedSettings }

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [undo, setUndo] = useState<{ id: string; message: string; run: () => void } | null>(null)
  const offerUndo = useCallback((message: string, run: () => void) => setUndo({ id: uid(), message, run }), [])

  // El tutorial se abre solo la primera vez que entras con esta cuenta
  useEffect(() => {
    if (ready && (isNewUser || !tutorialSeen)) setTourOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  const closeTour = useCallback(() => {
    setTourOpen(false)
    setTutorialSeen(true)
  }, [setTutorialSeen])

  const logEvent = useCallback(
    (kind: ActivityEvent['kind'], text: string) => setEvents((all) => [{ id: uid(), at: Date.now(), kind, text }, ...all].slice(0, MAX_EVENTS)),
    [setEvents],
  )

  // ── IA: check-ins que entrenan el modelo personal
  const [lastCheckInResult, setLastCheckInResult] = useState<ModelSummary | null>(null)
  const [checkInOpen, setCheckInOpen] = useState(false)
  const quietSince = useRef(Date.now()) // última vez que se preguntó o se pospuso
  const modelLastCheckIn = engine.signals?.model.lastCheckIn ?? 0
  const checkInMs = settings.checkInMinutes * 60_000

  useEffect(() => {
    if (!engine.isDesktop || checkInMs === 0) {
      setCheckInOpen(false)
      return
    }
    const id = window.setInterval(() => {
      const since = Math.max(quietSince.current, modelLastCheckIn)
      if (Date.now() - since > checkInMs) setCheckInOpen(true)
    }, 10_000)
    return () => window.clearInterval(id)
  }, [engine.isDesktop, modelLastCheckIn, checkInMs])

  const checkIn = useCallback(
    async (rating: number) => {
      setCheckInOpen(false)
      quietSince.current = Date.now()
      const result = await window.devpulse?.model.checkIn(rating)
      if (!result) return
      setLastCheckInResult(result)
      const label = RATINGS.find((r) => r.value === rating)?.label.toLowerCase()
      logEvent('load', `Te sentías «${label}»: predije ${result.lastPrediction}, era ${result.lastAnswer}. Modelo reentrenado`)
    },
    [logEvent],
  )

  const skipCheckIn = useCallback(() => {
    setCheckInOpen(false)
    quietSince.current = Date.now()
  }, [])

  const resetModel = useCallback(async () => {
    setConfirmReset(false)
    const result = await window.devpulse?.model.reset()
    if (result) setLastCheckInResult(null)
    logEvent('load', 'Borré lo que el modelo había aprendido')
  }, [logEvent])

  // ── Motor adaptativo: al entrar en carga alta, armar el bloqueador (si está activado en Ajustes)
  const prevLevel = useRef(engine.level)
  const autoBlock = settings.autoBlock
  useEffect(() => {
    if (engine.level === 'high' && prevLevel.current !== 'high') {
      if (autoBlock) setBlocker((b) => ({ ...b, armed: true }))
      logEvent('load', autoBlock ? 'Detecté carga alta: activé Enfoque Absoluto y el bloqueador' : 'Detecté carga alta: activé Enfoque Absoluto')
    }
    prevLevel.current = engine.level
  }, [engine.level, autoBlock, setBlocker, logEvent])

  // ── Bloqueador: el proceso principal recibe siempre la configuración vigente
  useEffect(() => {
    if (!ready) return
    window.devpulse?.blocker.configure({
      armed: blocker.armed,
      apps: blocker.apps.filter((a) => a.blocked).map(({ name, process }) => ({ name, process })),
    })
  }, [ready, blocker.armed, blocker.apps])

  useEffect(() => {
    return window.devpulse?.blocker.onEvent((e: BlockerEvent) => {
      if (e.type === 'closed') {
        const day = dayKey()
        setBlocker((b) => ({ ...b, closedByDay: { ...b.closedByDay, [day]: (b.closedByDay[day] ?? 0) + 1 } }))
        logEvent('blocker', `Cerré ${e.app} para proteger tu enfoque`)
      } else {
        setError(blockerError(e.app, e.reason))
      }
    })
  }, [setBlocker, logEvent])

  const removeBlockedApp = useCallback(
    (id: string) => {
      const index = blocker.apps.findIndex((a) => a.id === id)
      if (index === -1) return
      const app = blocker.apps[index]
      setBlocker((b) => ({ ...b, apps: b.apps.filter((a) => a.id !== id) }))
      offerUndo(`Quitaste ${app.name} de la lista`, () =>
        setBlocker((b) => (b.apps.some((a) => a.id === id) ? b : { ...b, apps: insertAt(b.apps, index, app) })),
      )
    },
    [blocker.apps, setBlocker, offerUndo],
  )

  // ── Pomodoro y tareas
  const addFocusSeconds = useCallback(
    (seconds: number) => {
      const day = dayKey()
      const hour = new Date().getHours()
      setFocusLog((log) => {
        const hours = [...(log[day] ?? Array(24).fill(0))]
        hours[hour] += seconds
        return { ...log, [day]: hours }
      })
    },
    [setFocusLog],
  )

