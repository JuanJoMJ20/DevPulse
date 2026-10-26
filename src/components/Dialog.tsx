import { useEffect, useId, useRef, type ReactNode } from 'react'

interface DialogProps {
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  /** Ancho máximo de la tarjeta */
  size?: 'sm' | 'md'
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Ventana modal accesible: atrapa el foco dentro, se cierra con Esc o
 * haciendo clic fuera, y al cerrarse devuelve el foco a donde estaba.
 */
export function Dialog({ title, description, onClose, children, size = 'md' }: DialogProps) {
  const titleId = useId()
  const descId = useId()
  const ref = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const first = ref.current?.querySelector<HTMLElement>('[data-autofocus]') ?? ref.current?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !ref.current) return
      const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (!items.length) return
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault()
        lastItem.focus()
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault()
        firstItem.focus()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      previous?.focus?.()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <div aria-hidden className="absolute inset-0 bg-[rgb(2_4_8/0.6)] backdrop-blur-sm" onMouseDown={() => onCloseRef.current()} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={`animate-rise relative max-h-[calc(100vh-2rem)] w-full overflow-y-auto rounded-2xl border border-line bg-elevated p-6 shadow-[var(--shadow-pop)] ${
          size === 'sm' ? 'max-w-sm' : 'max-w-lg'
        }`}
      >
        <h2 id={titleId} className="text-lg font-semibold tracking-tight text-fg">
          {title}
        </h2>
        {description && (
          <p id={descId} className="mt-1.5 text-sm leading-relaxed text-muted">
            {description}
          </p>
        )}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}

interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/** Confirmación para acciones que no se pueden deshacer */
export function ConfirmDialog({ title, description, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog title={title} description={description} onClose={onCancel} size="sm">
      <div className="flex justify-end gap-2">
        <button type="button" data-autofocus onClick={onCancel} className={BUTTON_SECONDARY}>
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="h-9 rounded-lg bg-danger-fill px-4 text-sm font-semibold text-on-danger transition hover:opacity-90"
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}

export const BUTTON_SECONDARY =
  'h-9 rounded-lg border border-line px-4 text-sm font-medium text-fg-2 transition hover:border-line-strong hover:text-fg'
export const BUTTON_PRIMARY =
  'h-9 rounded-lg bg-accent-fill px-4 text-sm font-semibold text-on-accent transition hover:bg-accent-hover'
