import type { CSSProperties, ReactNode } from 'react'
import type { WidgetId } from '../types'

interface PanelProps {
  id: WidgetId
  eyebrow: string
  title: string
  actions?: ReactNode
  className?: string
  children: ReactNode
}

/** Superficie compartida por todos los widgets */
export function Panel({ id, eyebrow, title, actions, className = '', children }: PanelProps) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      data-tour={id}
      style={{ viewTransitionName: `panel-${id}` } as CSSProperties}
      className={`group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-panel)] backdrop-blur-xl transition-colors duration-300 hover:border-line-strong ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">{eyebrow}</p>
          <h2 id={`${id}-title`} className="mt-1 truncate text-[15px] font-semibold tracking-tight text-fg">
            {title}
          </h2>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  )
}
