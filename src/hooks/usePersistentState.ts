import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react'

// En el navegador, cada cuenta tiene su propio espacio en localStorage.
// En escritorio no hace falta: el proceso principal ya abre el archivo de la cuenta activa.
let namespace = 'devpulse:'
export const setStorageNamespace = (userId: string) => {
  namespace = `devpulse:${userId}:`
}

async function readValue<T>(key: string): Promise<T | undefined> {
  if (window.devpulse) return window.devpulse.store.get<T>(key)
  try {
    const raw = localStorage.getItem(namespace + key)
    return raw ? (JSON.parse(raw) as T) : undefined
  } catch {
    return undefined
  }
}

async function writeValue(key: string, value: unknown): Promise<boolean> {
  if (window.devpulse) return window.devpulse.store.set(key, value)
  try {
    localStorage.setItem(namespace + key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/**
 * useState que sobrevive a reinicios. En escritorio guarda en %APPDATA%\DevPulse;
 * en el navegador, en localStorage. `ready` es false hasta leer el valor guardado,
 * para no sobrescribirlo con el valor inicial.
 */
export function usePersistentState<T>(key: string, initial: T, onSaveError?: () => void) {
  const [value, setValue] = useState<T>(initial)
  const [ready, setReady] = useState(false)
  const onErrorRef = useRef(onSaveError)
  onErrorRef.current = onSaveError

  useEffect(() => {
    let alive = true
    readValue<T>(key).then((stored) => {
      if (!alive) return
      if (stored !== undefined) setValue(stored)
      setReady(true)
    })
    return () => {
      alive = false
    }
  }, [key])

  useEffect(() => {
    if (!ready) return
    writeValue(key, value).then((ok) => {
      if (!ok) onErrorRef.current?.()
    })
  }, [key, value, ready])

  const set = useCallback((next: SetStateAction<T>) => setValue(next), [])
  return [value, set, ready] as const
}
