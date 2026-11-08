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

  const onSessionComplete = useCallback(
    (mode: Mode) => {
      if (mode === 'focus') {
        const day = dayKey()
        setSessions((s) => ({ ...s, [day]: (s[day] ?? 0) + 1 }))
        logEvent('session', `Sesión de enfoque completada${task ? ` · ${task.title}` : ''}`)
        window.devpulse?.notify('Sesión completada', 'Buen trabajo. Levántate y descansa unos minutos.')
      } else {
        window.devpulse?.notify('Pausa terminada', '¿Listo para otra sesión de enfoque?')
      }
    },
    [setSessions, logEvent, task],
  )

  // La tarea actual más reciente, para que «deshacer» no pise lo que hayas editado después
  const taskRef = useRef(task)
  taskRef.current = task

  const completeTask = useCallback(() => {
    if (!task) return
    const finished = task
    const promoted = queue[0] ?? null
    logEvent('task', `Terminaste «${finished.title}»`)
    setTask(promoted)
    setQueue(queue.slice(1))
    offerUndo(`Terminaste «${finished.title}»`, () => {
      const current = taskRef.current
      // La tarea que subió desde la cola vuelve a la cola, con lo que le hayas cambiado
      if (current && current.id === promoted?.id) setQueue((q) => [current, ...q])
      setTask(finished)
    })
  }, [task, queue, setTask, setQueue, logEvent, offerUndo])

  const removeSubtask = useCallback(
    (id: string) => {
      if (!task) return
      const index = task.subtasks.findIndex((s) => s.id === id)
      if (index === -1) return
      const item = task.subtasks[index]
      const taskId = task.id
      setTask((t) => (t ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== id) } : t))
      offerUndo(`Borraste el paso «${item.text}»`, () =>
        setTask((t) => (t && t.id === taskId && !t.subtasks.some((s) => s.id === id) ? { ...t, subtasks: insertAt(t.subtasks, index, item) } : t)),
      )
    },
    [task, setTask, offerUndo],
  )

  const removeFromQueue = useCallback(
    (id: string) => {
      const index = queue.findIndex((q) => q.id === id)
      if (index === -1) return
      const item = queue[index]
      setQueue((q) => q.filter((x) => x.id !== id))
      offerUndo(`Quitaste «${item.title}» de la cola`, () => setQueue((q) => (q.some((x) => x.id === id) ? q : insertAt(q, index, item))))
    },
    [queue, setQueue, offerUndo],
  )

  // ── Métricas del día
  const focusMinutesToday = (focusLog[today] ?? []).reduce((a, b) => a + b, 0) / 60
  const activeMinutes = engine.signals?.today.activeMinutes ?? 0
  const efficiency = activeMinutes >= 5 ? Math.min(100, Math.round((focusMinutesToday / activeMinutes) * 100)) : null

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center" role="status">
        <span className="animate-pulse-soft font-mono text-xs text-muted">Cargando tus datos…</span>
      </div>
    )
  }

  const widgets: Record<WidgetId, (span: string) => ReactNode> = {
    pomodoro: (span) => (
      <PomodoroWidget
        className={span}
        focus={isFocus}
        minutes={{ focus: settings.focusMinutes, short: settings.shortMinutes, long: settings.longMinutes }}
        task={task}
        queue={queue}
        completedToday={sessions[today] ?? 0}
        onTaskChange={setTask}
        onAddToQueue={(title) => setQueue((q) => [...q, { id: uid(), title, subtasks: [] }])}
        onRemoveFromQueue={removeFromQueue}
        onRemoveSubtask={removeSubtask}
        onCompleteTask={completeTask}
        onFocusSeconds={addFocusSeconds}
        onSessionComplete={onSessionComplete}
      />
    ),
    code: (span) => <ActiveCodePanel className={span} focus={isFocus} notes={notes} onNotesChange={setNotes} activeApp={engine.signals?.activeApp ?? null} />,
    metrics: (span) => (
      <MetricsPanel className={span} load={engine.load} history={engine.history} efficiency={efficiency} focusMinutesToday={focusMinutesToday} signals={engine.signals} />
    ),
    heatmap: (span) => <DeepWorkHeatmap className={span} log={focusLog} />,
    model: (span) => (
      <ModelPanel
        className={span}
        model={engine.signals?.model ?? null}
        factors={engine.signals?.factors ?? null}
        lastResult={lastCheckInResult}
        onCheckIn={checkIn}
        onReset={() => setConfirmReset(true)}
      />
    ),
    blocker: (span) => (
      <ContextBlocker
        className={span}
        armed={blocker.armed}
        apps={blocker.apps}
        closedToday={blocker.closedByDay[today] ?? 0}
        canBlock={engine.isDesktop}
        onArmedChange={(armed) => setBlocker((b) => ({ ...b, armed }))}
        onToggleApp={(id, blocked) => setBlocker((b) => ({ ...b, apps: b.apps.map((a) => (a.id === id ? { ...a, blocked } : a)) }))}
        onAddApp={(app: BlockedApp) => setBlocker((b) => ({ ...b, apps: [...b.apps, app] }))}
        onRemoveApp={removeBlockedApp}
      />
    ),
    notifications: (span) => <NotificationsPanel className={span} events={events} />,
  }

  return (
    <>
      <a
        href="#contenido"
        className="sr-only z-[80] rounded-lg bg-accent-fill px-4 py-2 text-sm font-semibold text-on-accent focus:not-sr-only focus:fixed focus:top-12 focus:left-4"
      >
        Saltar al contenido
      </a>

      <div className={`mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 pb-5 sm:px-6 lg:px-8 ${engine.isDesktop ? 'pt-11' : 'pt-5'}`}>
        {/* ── Barra superior ───────────────────────────── */}
        {/* Tres columnas fijas: nada de la barra se mueve cuando cambian la carga o el layout */}
        <header className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div data-tour="brand" className="min-w-0 justify-self-start">
            <h1 className="sr-only">DevPulse, panel de productividad y bienestar</h1>
            <Logo />
            <p className="mt-0.5 truncate pl-12 font-mono text-[11px] text-subtle">Productividad y bienestar</p>
          </div>

          <StressControl
            load={engine.load}
            loadLevel={engine.loadLevel}
            level={engine.level}
            auto={engine.auto}
            onOverride={engine.override}
            onSpike={engine.injectSpike}
          />

          <div className="flex items-center gap-3 justify-self-end">
            {/* Ancho fijo: que cambie el número no mueve los botones */}
            <div data-tour="efficiency" className="hidden w-32 text-right xl:block" title="Parte de tu tiempo activo de hoy que pasaste en sesiones de enfoque">
              <p className="font-mono text-[11px] whitespace-nowrap uppercase tracking-[0.08em] text-subtle">Eficiencia hoy</p>
              <p className="font-mono text-sm font-semibold text-fg tabular-nums">
                {efficiency === null ? '—' : `${efficiency}%`}
                <span className="sr-only"> del tiempo activo en enfoque</span>
              </p>
            </div>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setTourOpen(true)}
              aria-label="Ver tutorial"
              title="Ver tutorial"
              className="grid size-9 shrink-0 place-items-center rounded-full border border-line font-mono text-sm text-muted transition hover:border-accent/50 hover:text-accent"
            >
              ?
            </button>
            <UserMenu user={user} onSettings={() => setSettingsOpen(true)} onTutorial={() => setTourOpen(true)} onSignOut={onSignOut} />
          </div>
        </header>

        {/* ── Banner de Enfoque Absoluto ───────────────── */}
        {isFocus && (
          <div
            role="status"
            className="animate-rise mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger/30 bg-danger/10 px-5 py-3"
          >
            <p className="text-sm text-fg-2">
              <span className="font-semibold text-fg">Enfoque Absoluto activado.</span> Detecté fatiga, así que oculté {HIDDEN_COUNT.high} paneles
              {engine.isDesktop && blocker.armed ? ' y estoy cerrando tus apps de distracción' : ''}. Solo queda lo esencial.
            </p>
            <button
              type="button"
              onClick={() => engine.override('medium')}
              className="rounded-lg border border-line-strong bg-elevated px-3 py-1.5 text-xs font-medium text-fg transition hover:border-fg/40"
            >
              Volver a la vista completa
            </button>
          </div>
        )}

        {/* ── Retícula adaptativa ──────────────────────── */}
        <main id="contenido" tabIndex={-1} className={`grid flex-1 grid-flow-dense auto-rows-min grid-cols-1 gap-4 outline-none ${layout.grid}`}>
          {WIDGET_ORDER.map((id) => {
            const span = layout.slots[id]
            return span === undefined ? null : <Fragment key={id}>{widgets[id](span)}</Fragment>
          })}
        </main>

        {/* Espera a que la retícula esté en vista densa: si no, los paneles ocultos no existirían */}
        {tourOpen && level === 'low' && <Tutorial steps={tourSteps(user.name)} onClose={closeTour} />}

        {settingsOpen && <SettingsDialog settings={settings} onChange={setSettings} onClose={() => setSettingsOpen(false)} />}

        {confirmReset && (
          <ConfirmDialog
            title="¿Olvidar lo aprendido?"
            description={`El modelo volverá a los pesos de partida y se ${
              (engine.signals?.model.samples ?? 0) === 1 ? 'borrará tu respuesta' : `borrarán tus ${engine.signals?.model.samples ?? 0} respuestas`
            }. Esto no se puede deshacer.`}
            confirmLabel="Sí, olvidar"
            onConfirm={resetModel}
            onCancel={() => setConfirmReset(false)}
          />
        )}

        {checkInOpen && !error && !tourOpen && (
          <div className="fixed bottom-4 left-4 z-50 sm:bottom-6 sm:left-6">
            <CheckInPrompt onAnswer={checkIn} onSkip={skipCheckIn} />
          </div>
        )}

        {undo && (
          <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 sm:bottom-6">
            <UndoToast
              key={undo.id}
              message={undo.message}
              onUndo={() => {
                undo.run()
                setUndo(null)
              }}
              onClose={() => setUndo(null)}
            />
          </div>
        )}

        {/* ── Avisos ───────────────────────────────────── */}
        {error && (
          <div className="fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6">
            <HumanError {...error} onDismiss={() => setError(null)} />
          </div>
        )}
      </div>
    </>
  )
}
