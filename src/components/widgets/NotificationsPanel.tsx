import { useEffect, useState } from 'react'
import { timeAgo } from '../../lib/time'
import type { ActivityEvent } from '../../types'
import { Panel } from '../Panel'

const TONE: Record<ActivityEvent['kind'], { dot: string; label: string }> = {
  session: { dot: 'bg-accent-fill', label: 'Sesión' },
  task: { dot: 'bg-ok-fill', label: 'Tarea' },
  blocker: { dot: 'bg-violet-fill', label: 'Bloqueador' },
  load: { dot: 'bg-danger-fill', label: 'IA' },
}

export function NotificationsPanel({ className, events }: { className?: string; events: ActivityEvent[] }) {
  // Refresca los "hace X min" cada medio minuto
  const [, setNow] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <Panel
      id="notifications"
      eyebrow="Secundario"
      title="Actividad"
      className={className}
      actions={<span className="rounded-full bg-fg/10 px-2 py-0.5 font-mono text-[11px] text-muted">{events.length}</span>}
    >
      {events.length === 0 ? (
        <p className="text-sm text-muted">Aquí aparecerán tus sesiones, tareas terminadas y lo que haga el bloqueador.</p>
      ) : (
        <ul className="-mx-1.5 max-h-80 space-y-0.5 overflow-y-auto" aria-label="Historial de actividad">
          {events.map((n) => (
            <li key={n.id} className="flex gap-3 rounded-lg px-1.5 py-2 transition hover:bg-fg/5">
              <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${TONE[n.kind].dot}`} />
              <div className="min-w-0">
                <p className="text-sm text-fg-2">{n.text}</p>
                <p className="font-mono text-[11px] text-subtle">
                  {TONE[n.kind].label} · {timeAgo(n.at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
