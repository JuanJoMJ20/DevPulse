import { useCallback, useEffect, useState } from 'react'
import type { Signals, StressLevel } from '../types'

const HISTORY_SIZE = 60 // 60 lecturas × 2 s = último par de minutos
const isDesktop = typeof window !== 'undefined' && !!window.devpulse

/**
 * Histéresis: los umbrales de subida y bajada son distintos para que el layout
 * no "parpadee" cuando la carga ronda un límite.
 */
function nextLevel(prev: StressLevel, load: number): StressLevel {
  if (prev === 'high') return load < 58 ? 'medium' : 'high'
  if (prev === 'low') return load > 45 ? (load >= 70 ? 'high' : 'medium') : 'low'
  if (load >= 70) return 'high'
  if (load < 32) return 'low'
  return 'medium'
}

const clamp = (n: number) => Math.min(100, Math.max(0, n))

/**
 * Motor de carga cognitiva. En escritorio usa las señales reales del proceso
 * principal (ventana activa, inactividad y ritmo de tecleo). En el navegador
 * cae a una simulación para poder diseñar la UI sin Electron.
 */
export function useStressEngine() {
  const [auto, setAuto] = useState(true)
  const [signals, setSignals] = useState<Signals | null>(null)
  const [load, setLoad] = useState(20)
  const [autoLevel, setAutoLevel] = useState<StressLevel>('low')
  const [manualLevel, setManualLevel] = useState<StressLevel>('low')
  const [history, setHistory] = useState<number[]>(() => Array(HISTORY_SIZE).fill(20))

  useEffect(() => {
    if (window.devpulse) {
      return window.devpulse.onSignals((s) => {
        setSignals(s)
        setLoad(s.load)
      })
    }
    const id = window.setInterval(() => {
      setLoad((prev) => clamp(prev + (40 - prev) * 0.035 + (Math.random() - 0.5) * 7))
    }, 2000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    setHistory((h) => [...h.slice(1), load])
    setAutoLevel((prev) => nextLevel(prev, load))
  }, [load])

  // Solo en el navegador: forzar un pico para probar el layout
