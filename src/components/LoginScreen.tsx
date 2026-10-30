import { useId, useState, type FormEvent } from 'react'
import { AUTH_MESSAGES, auth } from '../lib/auth'
import type { User } from '../types'
import { ThemeToggle } from './ThemeToggle'

type Mode = 'login' | 'register'

interface LoginScreenProps {
  /** Si aún no hay cuentas en el equipo, se abre directamente en "Crear cuenta" */
  hasUsers: boolean
  onAuthenticated: (user: User, isNew: boolean) => void
}

const FEATURES = [
  { title: 'Detecta tu fatiga', body: 'Lee tu actividad real: cambios de app, pausas y ritmo de tecleo.' },
  { title: 'Aprende de ti', body: 'Un modelo de IA que se ajusta a lo que tú dices sentir.' },
  { title: 'Protege tu foco', body: 'Simplifica la pantalla y cierra las apps que te distraen.' },
]

function passwordStrength(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++
  return score // 0–4
}

const STRENGTH = [
  { label: 'Muy débil', bar: 'bg-danger-fill', text: 'text-danger' },
  { label: 'Débil', bar: 'bg-danger-fill', text: 'text-danger' },
  { label: 'Aceptable', bar: 'bg-warn-fill', text: 'text-warn' },
  { label: 'Buena', bar: 'bg-accent-fill', text: 'text-accent' },
  { label: 'Muy buena', bar: 'bg-ok-fill', text: 'text-ok' },
]

const INPUT =
  'h-11 w-full rounded-xl border border-control bg-sunken px-3.5 text-sm text-fg outline-none transition placeholder:text-subtle focus:border-accent aria-[invalid=true]:border-warn'

export function LoginScreen({ hasUsers, onAuthenticated }: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>(hasUsers ? 'login' : 'register')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const ids = { name: useId(), email: useId(), password: useId(), strength: useId(), error: useId(), panel: useId() }

  const strength = passwordStrength(password)

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const result = mode === 'login' ? await auth().login({ email, password, remember }) : await auth().register({ name, email, password })
      if (result.ok) onAuthenticated(result.user, mode === 'register')
      else setError(AUTH_MESSAGES[result.code])
    } catch {
