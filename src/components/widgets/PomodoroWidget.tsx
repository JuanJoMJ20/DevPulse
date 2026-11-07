import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { uid } from '../../lib/time'
import type { Task } from '../../types'
import { Panel } from '../Panel'

export type Mode = 'focus' | 'short' | 'long'

const MODE_LABELS: Record<Mode, string> = { focus: 'Enfoque', short: 'Pausa', long: 'Pausa larga' }
const SESSIONS_PER_CYCLE = 4

interface PomodoroWidgetProps {
  className?: string
  /** Variante expandida para el modo Enfoque Absoluto */
  focus?: boolean
  /** Duración de cada modo en minutos (viene de Ajustes) */
  minutes: Record<Mode, number>
  task: Task | null
  queue: Task[]
  completedToday: number
  onTaskChange: (task: Task) => void
  onAddToQueue: (title: string) => void
  onRemoveFromQueue: (id: string) => void
  onRemoveSubtask: (id: string) => void
  /** Marca la tarea actual como terminada y pasa a la siguiente de la cola */
  onCompleteTask: () => void
  /** Se llama cada segundo de enfoque transcurrido */
  onFocusSeconds: (seconds: number) => void
  onSessionComplete: (mode: Mode) => void
}

const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export function PomodoroWidget({
  className,
  focus = false,
  minutes,
  task,
  queue,
  completedToday,
  onTaskChange,
  onAddToQueue,
  onRemoveFromQueue,
  onRemoveSubtask,
  onCompleteTask,
  onFocusSeconds,
  onSessionComplete,
}: PomodoroWidgetProps) {
  const gradientId = useId()
  const [mode, setMode] = useState<Mode>('focus')
  const [remaining, setRemaining] = useState(minutes.focus * 60)
  const [running, setRunning] = useState(false)
  const endsAt = useRef<number | null>(null)
  const lastTick = useRef(0)

  // Las props cambian en cada render; el intervalo lee siempre la última versión
  const latest = useRef({ onFocusSeconds, onSessionComplete, completedToday, minutes })
  latest.current = { onFocusSeconds, onSessionComplete, completedToday, minutes }

  const total = minutes[mode] * 60
  // Si se acorta la duración con el temporizador en marcha, el anillo no se sale de 0–100 %
  const progress = Math.min(1, Math.max(0, 1 - remaining / total))

  const switchMode = useCallback((next: Mode) => {
    setMode(next)
    setRunning(false)
    endsAt.current = null
    setRemaining(latest.current.minutes[next] * 60)
  }, [])

  // Cambiar la duración en Ajustes reinicia el modo actual solo si está parado
  useEffect(() => {
    if (!running) {
      endsAt.current = null
      setRemaining(minutes[mode] * 60)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minutes[mode]])

  // Temporizador basado en timestamp: no deriva aunque la ventana pierda foco
  useEffect(() => {
    if (!running) return
    endsAt.current ??= Date.now() + remaining * 1000
    lastTick.current = Date.now()
    const id = window.setInterval(() => {
      const now = Date.now()
      if (mode === 'focus') {
        const elapsed = Math.floor((now - lastTick.current) / 1000)
        if (elapsed >= 1) {
          latest.current.onFocusSeconds(elapsed)
          lastTick.current += elapsed * 1000
        }
      }
      const left = Math.max(0, Math.round((endsAt.current! - now) / 1000))
      setRemaining(left)
      if (left === 0) {
        window.clearInterval(id)
        latest.current.onSessionComplete(mode)
        if (mode === 'focus') {
          const next = latest.current.completedToday + 1
          switchMode(next % SESSIONS_PER_CYCLE === 0 ? 'long' : 'short')
        } else {
          switchMode('focus')
        }
      }
    }, 250)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode])

  const toggle = useCallback(() => {
    setRunning((r) => {
      if (r) endsAt.current = null // pausa: se recalcula al reanudar
      return !r
    })
  }, [])

  // Atajo: barra espaciadora inicia/pausa, salvo si estás escribiendo o hay una ventana abierta
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      const typing = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(el.tagName) || el.isContentEditable
      const modalOpen = !!document.querySelector('[aria-modal="true"]')
      if (e.code === 'Space' && !typing && !modalOpen) {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])

  const size = focus ? 280 : 208
  const stroke = focus ? 10 : 8
  const r = (size - stroke) / 2 - 6
  const circumference = 2 * Math.PI * r
  const ticks = 60
  const cycleDone = completedToday % SESSIONS_PER_CYCLE

  return (
    <Panel
      id="pomodoro"
      eyebrow="Deep Work · Sesión actual"
      title="Temporizador y tarea"
      className={className}
      actions={
        <span className="font-mono text-xs text-subtle">
          <span className="text-fg tabular-nums">{completedToday}</span> sesiones hoy
        </span>
      }
    >
      <div className={`grid flex-1 items-center gap-6 ${focus ? 'grid-cols-1 py-4' : 'grid-cols-1 sm:grid-cols-[auto_1fr]'}`}>
        {/* ── Anillo ───────────────────────────── */}
        <div className="flex flex-col items-center gap-4">
          <div data-tour="pomodoro-modes" role="radiogroup" aria-label="Tipo de sesión" className="inline-flex rounded-lg border border-line bg-sunken p-0.5">
            {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => switchMode(m)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${mode === m ? 'bg-elevated text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
              >
                {MODE_LABELS[m]} <span className="font-mono text-subtle">{minutes[m]}′</span>
              </button>
            ))}
          </div>

          <div className="relative" style={{ width: size, height: size }}>
            <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90" aria-hidden>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" style={{ stopColor: 'var(--accent)' }} />
                  <stop offset="100%" style={{ stopColor: 'var(--accent-fill)' }} />
                </linearGradient>
              </defs>
              {Array.from({ length: ticks }, (_, i) => {
                const a = (i / ticks) * Math.PI * 2
                const outer = size / 2 - 1
                const inner = outer - (i % 5 === 0 ? 5 : 3)
                const lit = i / ticks <= progress
                return (
                  <line
                    key={i}
                    x1={size / 2 + Math.cos(a) * inner}
                    y1={size / 2 + Math.sin(a) * inner}
                    x2={size / 2 + Math.cos(a) * outer}
                    y2={size / 2 + Math.sin(a) * outer}
                    style={{ stroke: lit ? 'var(--accent-fill)' : 'var(--line)' }}
                    strokeWidth={1}
                  />
                )
              })}
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: 'var(--line)' }} strokeWidth={stroke} />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                className="transition-[stroke-dashoffset] duration-300 ease-linear"
                style={{ filter: 'drop-shadow(0 0 6px var(--glow))' }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                role="timer"
                aria-label={`${MODE_LABELS[mode]}: quedan ${Math.floor(remaining / 60)} minutos`}
                className={`font-mono font-medium tabular-nums tracking-tight text-fg ${focus ? 'text-6xl' : 'text-[44px]'}`}
              >
                {formatTime(remaining)}
              </span>
              <span className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                <span aria-hidden className={`size-1.5 rounded-full ${running ? 'animate-pulse-soft bg-accent-fill' : 'bg-subtle'}`} />
                {running ? (mode === 'focus' ? 'En flujo' : 'Descansando') : 'En pausa'}
              </span>
            </div>
          </div>

          <div data-tour="pomodoro-start" className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => switchMode(mode)}
              aria-label="Reiniciar la sesión"
              title="Reiniciar la sesión"
              className="grid size-10 place-items-center rounded-full border border-line text-muted transition hover:border-line-strong hover:text-fg"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={toggle}
              aria-keyshortcuts="Space"
              className="flex h-10 min-w-32 items-center justify-center gap-2 rounded-full bg-accent-fill px-5 text-sm font-semibold text-on-accent shadow-[0_0_24px_-4px_var(--glow)] transition hover:bg-accent-hover"
            >
              {running ? 'Pausar' : remaining < total ? 'Reanudar' : 'Iniciar'}
              <kbd aria-hidden className="rounded bg-on-accent/15 px-1 font-mono text-[11px]">
                Espacio
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-1.5" role="img" aria-label={`${cycleDone} de ${SESSIONS_PER_CYCLE} sesiones del ciclo`}>
            {Array.from({ length: SESSIONS_PER_CYCLE }, (_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i < cycleDone ? 'w-6 bg-accent-fill' : 'w-3 bg-fg/15'}`} />
            ))}
          </div>
        </div>

        {/* ── Tarea actual ─────────────────────── */}
        <div data-tour="pomodoro-task" className={`min-w-0 ${focus ? 'mx-auto w-full max-w-md' : ''}`}>
          {task ? (
            <TaskEditor task={task} onChange={onTaskChange} onRemoveSubtask={onRemoveSubtask} onComplete={onCompleteTask} />
          ) : (
            <NewTaskForm label="¿En qué vas a trabajar?" onAdd={(title) => onTaskChange({ id: uid(), title, subtasks: [] })} />
          )}

          {/* En Enfoque Absoluto la cola desaparece: solo existe la tarea actual */}
          {!focus && (
            <div className="mt-5 border-t border-line pt-4">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">A continuación</p>
              {queue.length > 0 && (
                <ul className="space-y-0.5">
                  {queue.map((q) => (
                    <li key={q.id} className="flex items-center justify-between gap-2 rounded-md px-1 py-1 text-sm text-muted hover:bg-fg/5">
                      <span className="truncate">{q.title}</span>
                      <RemoveButton label={`Quitar «${q.title}» de la cola`} onClick={() => onRemoveFromQueue(q.id)} />
                    </li>
                  ))}
                </ul>
              )}
              <NewTaskForm compact label="Añadir a la cola…" onAdd={onAddToQueue} />
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}

function TaskEditor({
  task,
  onChange,
  onRemoveSubtask,
  onComplete,
}: {
  task: Task
  onChange: (t: Task) => void
  onRemoveSubtask: (id: string) => void
  onComplete: () => void
}) {
  const doneCount = task.subtasks.filter((t) => t.done).length
  const pct = task.subtasks.length ? (doneCount / task.subtasks.length) * 100 : 0

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Tarea actual</p>
        <button
          type="button"
          onClick={onComplete}
          className="rounded-md border border-line px-2 py-0.5 text-xs font-medium text-muted transition hover:border-ok/40 hover:bg-ok/10 hover:text-ok"
        >
          ✓ Terminar tarea
        </button>
      </div>
      <input
        value={task.title}
        onChange={(e) => onChange({ ...task, title: e.target.value })}
        aria-label="Título de la tarea"
        className="mt-1 w-full rounded-md bg-transparent text-lg leading-snug font-semibold tracking-tight text-fg outline-none placeholder:text-subtle focus:bg-fg/5"
      />
      <p className="mt-1 font-mono text-xs text-subtle">
        {doneCount}/{task.subtasks.length} pasos
      </p>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-fg/10" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso de la tarea">
        <div className="h-full rounded-full bg-accent-fill transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>

      <ul className="mt-4 space-y-0.5">
        {task.subtasks.map((t) => (
          <li key={t.id} className="flex items-center gap-1">
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-fg/5">
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => onChange({ ...task, subtasks: task.subtasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)) })}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="grid size-4 shrink-0 place-items-center rounded border border-control transition peer-checked:border-accent-fill peer-checked:bg-accent-fill peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
              >
                {t.done && (
                  <svg viewBox="0 0 24 24" className="size-3 text-on-accent" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L19 7" />
                  </svg>
                )}
              </span>
              <span className={`truncate text-sm transition ${t.done ? 'text-subtle line-through' : 'text-fg-2'}`}>{t.text}</span>
            </label>
            <RemoveButton label={`Borrar el paso «${t.text}»`} onClick={() => onRemoveSubtask(t.id)} />
          </li>
        ))}
      </ul>
      <NewTaskForm compact label="Añadir paso…" onAdd={(text) => onChange({ ...task, subtasks: [...task.subtasks, { id: uid(), text, done: false }] })} />
    </>
  )
}

function NewTaskForm({ label, onAdd, compact }: { label: string; onAdd: (text: string) => void; compact?: boolean }) {
  const [text, setText] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = text.trim()
    if (!v) return
    onAdd(v)
    setText('')
  }
  return (
    <form onSubmit={submit} className={compact ? 'mt-1' : ''}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={label}
        aria-label={label}
        className={
          compact
            ? 'w-full rounded-lg border border-dashed border-control bg-transparent px-2 py-1.5 text-sm text-fg-2 outline-none placeholder:text-subtle focus:border-solid focus:border-accent focus:bg-fg/5'
            : 'w-full rounded-xl border border-control bg-sunken px-4 py-3 text-base text-fg outline-none transition placeholder:text-subtle focus:border-accent'
        }
      />
      <p className="sr-only">Pulsa Enter para añadir</p>
    </form>
  )
}

/** Botón de quitar siempre visible (antes solo aparecía al pasar el ratón) */
function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-7 shrink-0 place-items-center rounded text-subtle transition hover:bg-danger/10 hover:text-danger"
    >
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  )
}
