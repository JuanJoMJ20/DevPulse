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
