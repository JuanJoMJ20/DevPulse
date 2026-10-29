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
