import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

export interface TourStep {
  /** Valor de data-tour del elemento a iluminar; sin target, la tarjeta va centrada */
  target?: string
  title: string
  body: string
}

interface TutorialProps {
  steps: TourStep[]
  onClose: () => void
}

const CARD_W = 344
const CARD_H = 210 // estimación para decidir si cabe arriba o abajo
const GAP = 16
const PAD = 8

// Solo cuenta si el elemento se ve: uno oculto por tamaño de ventana no se puede iluminar
const findTarget = (target?: string) => {
  const el = target ? document.querySelector<HTMLElement>(`[data-tour="${target}"]`) : null
  return el && el.getClientRects().length > 0 ? el : null
}

/**
 * Tutorial guiado: oscurece la pantalla, ilumina un elemento cada vez y explica
 * para qué sirve. Se navega con los botones, con ← → o con Tab + Enter, y se cierra con Esc.
 */
export function Tutorial({ steps: allSteps, onClose }: TutorialProps) {
  // Se omiten los pasos cuyo elemento no está en pantalla
  const [steps] = useState(() => allSteps.filter((s) => !s.target || findTarget(s.target)))
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const step = steps[index]
  const isLast = index === steps.length - 1

  useLayoutEffect(() => {
    const el = findTarget(step.target)
    if (!el) {
      setRect(null)
      return
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' })
    // Seguimos el elemento durante el scroll suave y si cambia el tamaño de la ventana
    const update = () => setRect(el.getBoundingClientRect())
    update()
    const id = window.setInterval(update, 80)
    return () => window.clearInterval(id)
  }, [step])

  const next = useCallback(() => (isLast ? onClose() : setIndex((i) => i + 1)), [isLast, onClose])
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])

  // ← → navegan, Esc cierra. Enter lo maneja el botón que tenga el foco (si no, actuaría dos veces).
  // Tab queda atrapado dentro de la tarjeta.
  const cardRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Tab' && cardRef.current) {
        const items = [...cardRef.current.querySelectorAll<HTMLElement>('button')]
        if (!items.length) return
        const i = items.indexOf(document.activeElement as HTMLElement)
        e.preventDefault()
        const nextIndex = i === -1 ? 0 : (i + (e.shiftKey ? -1 : 1) + items.length) % items.length
        items[nextIndex].focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, onClose])

  const card = cardPosition(rect)

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-body">
      {rect ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-2xl ring-2 ring-accent transition-all duration-300 ease-out"
          style={{
            left: rect.left - PAD,
            top: rect.top - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgb(2 4 8 / 0.72), 0 0 40px 4px var(--glow)',
          }}
        />
      ) : (
        <div aria-hidden className="fixed inset-0 bg-[rgb(2_4_8/0.78)] backdrop-blur-sm" />
      )}

      <div
        ref={cardRef}
        key={index}
        className="animate-rise fixed rounded-2xl border border-line bg-elevated p-5 shadow-[var(--shadow-pop)]"
        style={{ width: CARD_W, ...card }}
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent" aria-live="polite">
          Paso {index + 1} de {steps.length}
        </p>
        <h2 id="tour-title" className="mt-1.5 text-base font-semibold tracking-tight text-fg">
          {step.title}
        </h2>
        <p id="tour-body" className="mt-2 text-sm leading-relaxed text-muted">
          {step.body}
        </p>

        <div className="mt-4 flex gap-1" aria-hidden>
          {steps.map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= index ? 'bg-accent-fill' : 'bg-fg/10'}`} />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button type="button" onClick={onClose} className="rounded px-1 text-xs text-muted transition hover:text-fg">
            {isLast ? 'Cerrar' : 'Saltar tutorial'}
          </button>
          <div className="flex gap-2">
            {index > 0 && (
              <button
                type="button"
