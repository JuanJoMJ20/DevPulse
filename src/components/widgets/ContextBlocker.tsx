import { useState, type FormEvent } from 'react'
import { uid } from '../../lib/time'
import type { BlockedApp } from '../../types'
import { Panel } from '../Panel'
import { Switch } from '../Switch'

interface ContextBlockerProps {
  className?: string
  armed: boolean
  apps: BlockedApp[]
  closedToday: number
  /** false en el navegador: no hay acceso a procesos */
  canBlock: boolean
  onArmedChange: (armed: boolean) => void
  onToggleApp: (id: string, blocked: boolean) => void
  onAddApp: (app: BlockedApp) => void
  onRemoveApp: (id: string) => void
}

export function ContextBlocker({ className, armed, apps, closedToday, canBlock, onArmedChange, onToggleApp, onAddApp, onRemoveApp }: ContextBlockerProps) {
  const [newProcess, setNewProcess] = useState('')
  const [hint, setHint] = useState<string | null>(null)
  const blockedCount = apps.filter((s) => s.blocked).length

  const addApp = (e: FormEvent) => {
    e.preventDefault()
    let process = newProcess.trim()
    if (!process) return
    if (!process.toLowerCase().endsWith('.exe')) process += '.exe'
    // Evita duplicados: el mismo programa no se añade dos veces
    if (apps.some((a) => a.process.toLowerCase() === process.toLowerCase())) {
      setHint(`${process} ya está en la lista.`)
      return
    }
    const name = process.replace(/\.exe$/i, '')
    onAddApp({ id: uid(), name: name.charAt(0).toUpperCase() + name.slice(1), process, blocked: true })
    setNewProcess('')
    setHint(null)
  }

  return (
    <Panel
      id="blocker"
      eyebrow="Protección"
      title="Bloqueador de contexto"
      className={className}
      actions={<Switch checked={armed} onChange={onArmedChange} label="Activar el escudo del bloqueador" />}
    >
      <div
        className={`relative mb-4 flex items-center gap-4 overflow-hidden rounded-xl border p-3.5 transition-colors duration-500 ${
          armed ? 'border-accent/30 bg-accent/10' : 'border-line bg-sunken'
        }`}
      >
        <div aria-hidden className="relative grid size-11 shrink-0 place-items-center">
          {armed && <span className="absolute inset-0 animate-ping rounded-full bg-accent/15 [animation-duration:2.5s]" />}
          <svg viewBox="0 0 24 24" className={`relative size-7 transition-colors ${armed ? 'text-accent' : 'text-subtle'}`} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round">
            <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z" />
            {armed && <path d="M9 12l2 2 4-4" strokeLinecap="round" />}
          </svg>
        </div>
        <div className="min-w-0" aria-live="polite">
          <p className={`text-sm font-semibold ${armed ? 'text-fg' : 'text-fg-2'}`}>{armed ? 'Escudo activo' : 'Escudo en reposo'}</p>
          <p className="font-mono text-xs text-muted">
            {!canBlock ? (
              'Solo funciona en la app de escritorio'
            ) : armed ? (
              <>
                Cierro {blockedCount} apps · <span className="font-semibold text-accent tabular-nums">{closedToday}</span> cerradas hoy
              </>
            ) : (
              'Las distracciones pueden pasar'
            )}
          </p>
        </div>
      </div>

      <ul className="space-y-0.5" aria-label="Apps de la lista">
        {apps.map((s) => {
          const active = armed && s.blocked
          return (
            <li key={s.id} className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-1.5">
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  aria-hidden
                  className={`grid size-7 shrink-0 place-items-center rounded-md font-mono text-xs uppercase transition ${active ? 'bg-fg/5 text-subtle line-through' : 'bg-fg/10 text-fg-2'}`}
                >
                  {s.name.charAt(0)}
                </span>
                <span className="min-w-0">
                  <span className={`block truncate text-sm transition ${active ? 'text-muted' : 'text-fg-2'}`}>{s.name}</span>
                  <span className="block truncate font-mono text-[11px] text-subtle">{s.process}</span>
                </span>
              </span>
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onRemoveApp(s.id)}
                  aria-label={`Quitar ${s.name} de la lista`}
                  title={`Quitar ${s.name} de la lista`}
                  className="grid size-7 place-items-center rounded text-subtle transition hover:bg-danger/10 hover:text-danger"
                >
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
                <Switch small checked={s.blocked} onChange={(v) => onToggleApp(s.id, v)} label={`Bloquear ${s.name}`} />
              </span>
            </li>
          )
        })}
      </ul>

      <form onSubmit={addApp} className="mt-2">
        <input
          value={newProcess}
          onChange={(e) => {
            setNewProcess(e.target.value)
            setHint(null)
          }}
          placeholder="Añadir programa (ej. steam.exe)"
          aria-label="Añadir programa a bloquear"
          aria-describedby="blocker-hint"
          className="w-full rounded-lg border border-dashed border-control bg-transparent px-2 py-1.5 font-mono text-xs text-fg-2 outline-none placeholder:text-subtle focus:border-solid focus:border-accent focus:bg-sunken"
        />
        <p id="blocker-hint" className={`mt-1 px-1.5 text-xs ${hint ? 'text-warn' : 'sr-only'}`} aria-live="polite">
          {hint ?? 'Escribe el nombre del programa y pulsa Enter'}
        </p>
      </form>

      <p className="mt-auto pt-3 text-xs leading-relaxed text-subtle">
        Primero pido a cada app que se cierre para que guarde lo pendiente. Si sigue abierta, la cierro a la fuerza.
      </p>
    </Panel>
  )
}
