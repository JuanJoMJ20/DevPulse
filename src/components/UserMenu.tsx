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

