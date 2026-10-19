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
