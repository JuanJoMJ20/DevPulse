import type { AuthResult, User } from '../types'

/**
 * Acceso a cuentas. En escritorio lo resuelve el proceso principal (scrypt,
 * archivo por cuenta). En el navegador hay un sustituto en localStorage con
 * PBKDF2, pensado solo para diseñar la UI sin Electron.
 */

interface StoredUser extends User {
  salt: string
  hash: string
}

const LS_USERS = 'devpulse:users'
const LS_REMEMBERED = 'devpulse:remembered'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const readUsers = (): StoredUser[] => {
  try {
    return JSON.parse(localStorage.getItem(LS_USERS) ?? '[]')
  } catch {
    return []
  }
}

async function pbkdf2(password: string, salt: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100_000, hash: 'SHA-256' }, key, 256)
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const strip = ({ id, name, email, createdAt }: StoredUser): User => ({ id, name, email, createdAt })

const browserAuth = {
  async status() {
    const users = readUsers()
    const remembered = users.find((u) => u.id === localStorage.getItem(LS_REMEMBERED))
    return { hasUsers: users.length > 0, user: remembered ? strip(remembered) : null }
  },
  async register({ name, email, password }: { name: string; email: string; password: string }): Promise<AuthResult> {
    const cleanEmail = email.trim().toLowerCase()
    if (name.trim().length < 2) return { ok: false, code: 'name' }
    if (!EMAIL_RE.test(cleanEmail)) return { ok: false, code: 'email' }
    if (password.length < 8) return { ok: false, code: 'weak' }
    const users = readUsers()
    if (users.some((u) => u.email === cleanEmail)) return { ok: false, code: 'exists' }
    const salt = crypto.randomUUID()
    const user: StoredUser = { id: crypto.randomUUID(), name: name.trim(), email: cleanEmail, createdAt: Date.now(), salt, hash: await pbkdf2(password, salt) }
    localStorage.setItem(LS_USERS, JSON.stringify([...users, user]))
    localStorage.setItem(LS_REMEMBERED, user.id)
    return { ok: true, user: strip(user), isFirst: users.length === 0 }
  },
  async login({ email, password, remember }: { email: string; password: string; remember: boolean }): Promise<AuthResult> {
    const user = readUsers().find((u) => u.email === email.trim().toLowerCase())
    if (!user || (await pbkdf2(password, user.salt)) !== user.hash) return { ok: false, code: 'credentials' }
    if (remember) localStorage.setItem(LS_REMEMBERED, user.id)
    else localStorage.removeItem(LS_REMEMBERED)
    return { ok: true, user: strip(user) }
  },
  async logout() {
    localStorage.removeItem(LS_REMEMBERED)
    return true
  },
}

export const auth = () => window.devpulse?.auth ?? browserAuth

/** Mensajes humanos para cada fallo: qué pasó, y qué hacer, en una línea */
export const AUTH_MESSAGES: Record<string, string> = {
  name: 'Escribe tu nombre (al menos 2 letras).',
  email: 'Ese correo no parece válido. Revisa que tenga @ y un dominio.',
  weak: 'La contraseña necesita al menos 8 caracteres.',
  exists: 'Ya hay una cuenta con ese correo en este equipo. Inicia sesión con ella.',
  credentials: 'El correo o la contraseña no coinciden. Revísalos e inténtalo de nuevo.',
}
