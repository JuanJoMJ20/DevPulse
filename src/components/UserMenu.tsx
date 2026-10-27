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
