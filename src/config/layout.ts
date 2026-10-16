import type { StressLevel, WidgetId } from '../types'

export interface LayoutConfig {
  label: string
  description: string
  /** Clases de columnas del contenedor */
  grid: string
  /**
   * Clases de span por widget. Si un widget no aparece aquí, se oculta.
   * Todas las clases son literales completos para que Tailwind las detecte en build.
   */
  slots: Partial<Record<WidgetId, string>>
}

/** Orden de prioridad en el DOM: lo crítico primero (Contenido > Jerarquía) */
export const WIDGET_ORDER: WidgetId[] = ['pomodoro', 'metrics', 'code', 'blocker', 'heatmap', 'model', 'notifications']

export const LAYOUTS: Record<StressLevel, LayoutConfig> = {
  low: {
    label: 'Vista densa',
