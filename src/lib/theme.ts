import { useSyncExternalStore } from 'react'

export type ThemePref = 'system' | 'light' | 'dark'
export type Theme = 'light' | 'dark'

/**
 * El tema es una preferencia del equipo, no de la cuenta: se aplica también
 * en la pantalla de inicio de sesión, antes de saber quién eres.
 */
const KEY = 'devpulse:theme'
const media = window.matchMedia('(prefers-color-scheme: dark)')
const listeners = new Set<() => void>()

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
  } catch {
    return 'system'
  }
}

let pref: ThemePref = readPref()

export const resolveTheme = (p: ThemePref = pref): Theme => (p === 'system' ? (media.matches ? 'dark' : 'light') : p)

function apply() {
  const theme = resolveTheme()
  document.documentElement.dataset.theme = theme
  window.devpulse?.setTheme(theme)
}

const notify = () => listeners.forEach((l) => l())

export function setThemePref(next: ThemePref) {
  pref = next
  try {
    localStorage.setItem(KEY, next)
  } catch {
    // sin almacenamiento el tema dura hasta cerrar la app
  }
  apply()
  notify()
}

media.addEventListener('change', () => {
  if (pref !== 'system') return
  apply()
  notify()
})

export const initTheme = apply

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Preferencia elegida y tema que se ve realmente */
export function useTheme() {
  const current = useSyncExternalStore(subscribe, () => pref)
  return { pref: current, theme: resolveTheme(current), setPref: setThemePref }
}
