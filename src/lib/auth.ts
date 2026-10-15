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

