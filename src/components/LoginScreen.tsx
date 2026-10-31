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
      setError('No pude comprobar tu cuenta. Cierra DevPulse y vuelve a abrirlo; tus datos siguen guardados.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Debajo de la franja de la barra de título para no chocar con los botones de la ventana */}
      <div className="absolute top-12 right-6 z-10">
        <ThemeToggle />
      </div>

      {/* ── Marca ───────────────────────────────── */}
      <aside className="relative hidden overflow-hidden border-r border-line p-12 lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="pointer-events-none absolute -top-40 -left-40 size-[520px] rounded-full bg-accent/10 blur-[120px]" />
        <Logo />

        <div className="relative">
          <svg viewBox="0 0 480 120" className="mb-10 w-full max-w-md" aria-hidden>
            <path
              d="M0 60 H140 L165 20 L195 100 L222 35 L246 75 L262 60 H480"
              fill="none"
              stroke="url(#login-pulse)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-[draw_2.4s_ease-in-out_infinite] [stroke-dasharray:640]"
            />
            <defs>
              <linearGradient id="login-pulse" x1="0" x2="1">
                <stop offset="0" style={{ stopColor: 'var(--accent-fill)', stopOpacity: 0 }} />
                <stop offset="0.45" style={{ stopColor: 'var(--accent)' }} />
                <stop offset="1" style={{ stopColor: 'var(--accent-fill)', stopOpacity: 0 }} />
              </linearGradient>
            </defs>
          </svg>
          <p className="max-w-md text-4xl font-semibold leading-tight tracking-tight text-fg">
            Tu foco,
            <br />
            protegido por <span className="text-accent">IA</span>.
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            DevPulse mide tu carga mental mientras programas y adapta el espacio de trabajo antes de que la fatiga te gane.
          </p>
          <ul className="mt-10 space-y-5">
            {FEATURES.map((f, i) => (
              <li key={f.title} className="flex gap-4">
                <span aria-hidden className="mt-0.5 font-mono text-xs text-accent">
                  0{i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-fg">{f.title}</p>
                  <p className="text-sm text-muted">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative font-mono text-xs text-subtle">Tus datos no salen de este equipo</p>
      </aside>

      {/* ── Formulario ──────────────────────────── */}
      <main className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-fg">{mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</h1>
          <p className="mt-1.5 text-sm text-muted">{mode === 'login' ? 'Inicia sesión para seguir donde lo dejaste.' : 'Tu modelo personal empieza a aprender desde hoy.'}</p>

          <div role="tablist" aria-label="Acceso" className="mt-8 grid grid-cols-2 rounded-xl border border-line bg-sunken p-1">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                role="tab"
                type="button"
                id={`${ids.panel}-${m}`}
                aria-selected={mode === m}
                aria-controls={ids.panel}
                onClick={() => switchMode(m)}
                className={`rounded-lg py-2 text-sm font-medium transition ${mode === m ? 'bg-elevated text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            ))}
          </div>

          <form id={ids.panel} role="tabpanel" aria-labelledby={`${ids.panel}-${mode}`} onSubmit={submit} className="mt-6 space-y-4" noValidate>
            {mode === 'register' && (
              <div>
                <label htmlFor={ids.name} className="mb-1.5 block text-xs font-medium text-fg-2">
                  Nombre
                </label>
                <input id={ids.name} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Cómo quieres que te llame" className={INPUT} autoFocus />
              </div>
            )}
            <div>
              <label htmlFor={ids.email} className="mb-1.5 block text-xs font-medium text-fg-2">
                Correo electrónico
              </label>
              <input
                id={ids.email}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="tu@correo.com"
                aria-invalid={!!error}
                aria-describedby={error ? ids.error : undefined}
                className={INPUT}
                autoFocus={mode === 'login'}
              />
            </div>
            <div>
              <label htmlFor={ids.password} className="mb-1.5 block text-xs font-medium text-fg-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id={ids.password}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : '••••••••'}
                  aria-invalid={!!error}
                  aria-describedby={[mode === 'register' && password ? ids.strength : '', error ? ids.error : ''].filter(Boolean).join(' ') || undefined}
                  className={`${INPUT} pr-24`}
                />
                <button
