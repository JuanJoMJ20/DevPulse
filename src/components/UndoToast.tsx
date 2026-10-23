import { useEffect, useRef } from 'react'

const VISIBLE_MS = 7000

interface UndoToastProps {
  message: string
  onUndo: () => void
  onClose: () => void
}

/** Aviso temporal con opción de deshacer la última acción destructiva */
export function UndoToast({ message, onUndo, onClose }: UndoToastProps) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const id = window.setTimeout(() => onCloseRef.current(), VISIBLE_MS)
    return () => window.clearTimeout(id)
  }, [message])

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-rise flex items-center gap-4 rounded-xl border border-line bg-elevated py-2.5 pr-2.5 pl-4 shadow-[var(--shadow-pop)]"
    >
      <p className="text-sm text-fg-2">{message}</p>
      <button
        type="button"
        onClick={onUndo}
        className="rounded-lg px-3 py-1.5 text-sm font-semibold text-accent transition hover:bg-accent/10"
      >
        Deshacer
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar aviso"
        className="grid size-8 place-items-center rounded-lg text-subtle transition hover:bg-fg/5 hover:text-fg"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  )
}
