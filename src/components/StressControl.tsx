import type { StressLevel } from '../types'

const LEVEL_META: Record<StressLevel, { label: string; text: string; bar: string }> = {
  low: { label: 'Baja', text: 'text-accent', bar: 'bg-accent-fill' },
  medium: { label: 'Media', text: 'text-warn', bar: 'bg-warn-fill' },
  high: { label: 'Alta', text: 'text-danger', bar: 'bg-danger-fill' },
}

const OPTIONS: { value: StressLevel | 'auto'; label: string; hint: string }[] = [
  { value: 'auto', label: 'IA', hint: 'La IA decide la vista según tu carga' },
  { value: 'low', label: 'Baja', hint: 'Fijar la vista completa' },
  { value: 'medium', label: 'Media', hint: 'Fijar la vista equilibrada' },
  { value: 'high', label: 'Alta', hint: 'Fijar Enfoque Absoluto' },
]

interface StressControlProps {
  load: number
  /** Nivel que corresponde a la carga, no al layout elegido */
  loadLevel: StressLevel
  /** Layout fijado a mano (si auto es false) */
  level: StressLevel
  auto: boolean
  onOverride: (level: StressLevel | 'auto') => void
  /** Solo existe en modo navegador, donde la carga es simulada */
  onSpike?: () => void
}

export function StressControl({ load, loadLevel, level, auto, onOverride, onSpike }: StressControlProps) {
