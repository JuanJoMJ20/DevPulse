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
          <button
            key={r.value}
            type="button"
            onClick={() => onAnswer(r.value)}
            title={r.label}
            aria-label={`${r.value}: ${r.label}`}
            className="rounded-lg border border-line py-1.5 font-mono text-sm font-semibold text-fg transition hover:border-accent/50 hover:bg-accent/10"
          >
            {r.value}
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span aria-hidden>Fresco</span>
        <button type="button" onClick={onSkip} className="rounded px-1 text-muted underline-offset-2 hover:text-fg hover:underline">
          Ahora no
        </button>
        <span aria-hidden>Agotado</span>
      </div>
    </div>
  )
}
