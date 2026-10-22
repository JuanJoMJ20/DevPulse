interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  small?: boolean
}

/** Interruptor accesible (role="switch"), usado en Ajustes y en el Bloqueador */
export function Switch({ checked, onChange, label, small }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 rounded-full border transition-colors duration-300 ${small ? 'h-5 w-9' : 'h-6 w-11'} ${
        checked ? 'border-transparent bg-accent-fill' : 'border-control bg-sunken'
      }`}
    >
      <span
        aria-hidden
        className={`absolute top-1/2 left-0.5 -translate-y-1/2 rounded-full shadow transition-transform duration-300 ${small ? 'size-3.5' : 'size-4.5'} ${
          checked ? `bg-on-accent ${small ? 'translate-x-4' : 'translate-x-5'}` : 'bg-muted'
        }`}
      />
    </button>
  )
}
