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
          <span className="flex max-w-56 items-center gap-1.5 truncate font-mono text-xs text-muted" title={`App activa: ${activeApp.title}`}>
            <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-ok-fill" />
            <span className="sr-only">App activa:</span>
            <span className="truncate">{activeApp.exe.replace(/\.exe$/i, '')}</span>
          </span>
        )
      }
    >
      <div className={`relative -mx-5 -mb-5 flex flex-1 overflow-auto border-t border-line bg-sunken font-mono text-[13px] leading-6 ${focus ? 'min-h-[440px]' : 'min-h-[300px]'}`}>
        <ol aria-hidden className="w-12 shrink-0 select-none py-3 pr-4 text-right text-subtle tabular-nums">
          {Array.from({ length: lines }, (_, i) => (
            <li key={i}>{i + 1}</li>
          ))}
        </ol>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          spellCheck={false}
          aria-label="Notas de la sesión. Se guardan solas."
          placeholder={'// Apunta aquí lo que no quieres olvidar\n// sin salir de tu flujo.'}
          className="flex-1 resize-none bg-transparent py-3 pr-5 text-fg-2 caret-accent outline-none placeholder:text-subtle"
          style={{ minHeight: lines * 24 + 24 }}
        />
      </div>
    </Panel>
  )
}
