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
