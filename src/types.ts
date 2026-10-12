export type StressLevel = 'low' | 'medium' | 'high'

/** Preferencias de cada cuenta (el tema es del equipo y va aparte) */
export interface Settings {
  focusMinutes: number
  shortMinutes: number
  longMinutes: number
  /** Cada cuánto pregunta la IA cómo te sientes; 0 = nunca */
  checkInMinutes: number
  /** Activar el bloqueador al entrar en Enfoque Absoluto */
  autoBlock: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  focusMinutes: 25,
  shortMinutes: 5,
  longMinutes: 15,
  checkInMinutes: 25,
  autoBlock: true,
}

export interface User {
  id: string
  name: string
  email: string
  createdAt: number
}

