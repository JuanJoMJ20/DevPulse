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
