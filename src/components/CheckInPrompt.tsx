import { RATINGS } from './widgets/ModelPanel'

interface CheckInPromptProps {
  onAnswer: (rating: number) => void
  onSkip: () => void
}

/** Pregunta periódica y discreta para que el modelo aprenda de ti */
export function CheckInPrompt({ onAnswer, onSkip }: CheckInPromptProps) {
  return (
    <div
      role="region"
      aria-labelledby="checkin-prompt-title"
      className="animate-rise w-full max-w-xs rounded-2xl border border-accent/30 bg-elevated p-4 shadow-[var(--shadow-pop)]"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">IA · Check-in</p>
      <p id="checkin-prompt-title" className="mt-1 text-sm font-semibold text-fg">
        ¿Cómo te sientes ahora mismo?
      </p>
      <div className="mt-3 grid grid-cols-5 gap-1">
        {RATINGS.map((r) => (
