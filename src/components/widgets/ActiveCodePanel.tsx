import { Panel } from '../Panel'

interface ActiveCodePanelProps {
  className?: string
  focus?: boolean
  notes: string
  onNotesChange: (notes: string) => void
  /** Ventana en primer plano según el proceso principal */
  activeApp: { exe: string; title: string } | null
}

/**
 * Bloc de foco: notas en monoespaciada junto a la ventana en la que trabajas.
 * Es el segundo panel crítico que sobrevive al Enfoque Absoluto.
 */
export function ActiveCodePanel({ className, focus = false, notes, onNotesChange, activeApp }: ActiveCodePanelProps) {
  const lines = Math.max(notes.split('\n').length, focus ? 22 : 14)

  return (
    <Panel
      id="code"
      eyebrow="Editor · Bloc de foco"
      title="Notas de la sesión"
      className={className}
      actions={
        activeApp && (
