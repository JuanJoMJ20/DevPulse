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
    description: '4 columnas · todos los paneles',
    grid: 'md:grid-cols-2 xl:grid-cols-4',
    slots: {
      pomodoro: 'md:col-span-2 xl:col-span-2 xl:row-span-2',
      metrics: 'md:col-span-2 xl:col-span-2',
      code: 'md:col-span-2 xl:col-span-2',
      heatmap: 'md:col-span-2 xl:col-span-2',
      blocker: 'xl:col-span-1',
      notifications: 'xl:col-span-1',
      model: 'md:col-span-2 xl:col-span-4',
    },
  },
  medium: {
    label: 'Vista equilibrada',
    description: '3 columnas · notificaciones silenciadas',
    grid: 'md:grid-cols-2 xl:grid-cols-3',
    slots: {
      pomodoro: 'md:col-span-2 xl:col-span-2 xl:row-span-2',
      metrics: 'xl:col-span-1',
      blocker: 'xl:col-span-1',
      code: 'md:col-span-2 xl:col-span-2',
      heatmap: 'md:col-span-2 xl:col-span-1',
      model: 'md:col-span-2 xl:col-span-3',
    },
  },
  high: {
    label: 'Enfoque Absoluto',
    description: '2 columnas · solo temporizador y notas',
    grid: 'md:grid-cols-2',
    slots: {
      pomodoro: 'md:col-span-1',
      code: 'md:col-span-1',
    },
  },
}

export const HIDDEN_COUNT: Record<StressLevel, number> = {
  low: 0,
  medium: WIDGET_ORDER.length - Object.keys(LAYOUTS.medium.slots).length,
  high: WIDGET_ORDER.length - Object.keys(LAYOUTS.high.slots).length,
}
