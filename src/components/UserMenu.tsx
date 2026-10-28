import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { User } from '../types'

interface UserMenuProps {
  user: User
  onSettings: () => void
  onTutorial: () => void
  onSignOut: () => void
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')

export function UserMenu({ user, onSettings, onTutorial, onSignOut }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Se cierra al hacer clic fuera o con Esc (devolviendo el foco al botón)
  useEffect(() => {
    if (!open) return
    menuRef.current?.querySelector<HTMLElement>('[role=menuitem]')?.focus()
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Flechas ↑ ↓ para moverse entre las opciones del menú
  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? [])]
    const i = items.indexOf(document.activeElement as HTMLElement)
    items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus()
  }

  const choose = (action: () => void) => () => {
    setOpen(false)
    action()
  }

  return (
    <div ref={ref} className="relative" data-tour="user-menu">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Menú de ${user.name}`}
        className="flex items-center gap-2.5 rounded-full border border-line py-1 pr-3 pl-1 transition hover:border-line-strong"
      >
        <span aria-hidden className="grid size-7 place-items-center rounded-full bg-accent/15 text-[11px] font-semibold text-accent ring-1 ring-accent/30">
          {initials(user.name)}
        </span>
        <span className="hidden max-w-28 truncate text-xs font-medium text-fg-2 xl:inline">{user.name.split(' ')[0]}</span>
        <svg viewBox="0 0 24 24" aria-hidden className={`size-3.5 text-muted transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Opciones de la cuenta"
          onKeyDown={onMenuKey}
          className="animate-rise absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-elevated shadow-[var(--shadow-pop)]"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold text-fg">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <p className="mt-1 font-mono text-[11px] text-subtle">
              Cuenta local desde {new Date(user.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="p-1.5">
            <MenuItem onClick={choose(onSettings)}>Ajustes</MenuItem>
            <MenuItem onClick={choose(onTutorial)}>Ver tutorial</MenuItem>
            <MenuItem danger onClick={choose(onSignOut)}>
              Cerrar sesión
            </MenuItem>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuItem({ children, onClick, danger }: { children: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition focus:outline-none focus-visible:bg-fg/10 ${danger ? 'text-danger hover:bg-danger/10' : 'text-fg-2 hover:bg-fg/5'}`}
    >
      {children}
    </button>
  )
}
