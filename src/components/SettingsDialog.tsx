import { useEffect, useId, useState, type ReactNode } from 'react'
import { useTheme, type ThemePref } from '../lib/theme'
import { DEFAULT_SETTINGS, type Settings } from '../types'
import { BUTTON_PRIMARY, BUTTON_SECONDARY, Dialog } from './Dialog'
import { Switch } from './Switch'

interface SettingsDialogProps {
  settings: Settings
  onChange: (settings: Settings) => void
  onClose: () => void
}

const THEMES: { value: ThemePref; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
]

const CHECK_IN_OPTIONS = [
  { value: 15, label: 'Cada 15 minutos' },
  { value: 25, label: 'Cada 25 minutos' },
  { value: 45, label: 'Cada 45 minutos' },
  { value: 0, label: 'Nunca (solo cuando yo responda)' },
]

/** Los cambios se aplican al momento; no hace falta guardar */
export function SettingsDialog({ settings, onChange, onClose }: SettingsDialogProps) {
  const { pref, setPref } = useTheme()
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => onChange({ ...settings, [key]: value })

  return (
    <Dialog title="Ajustes" description="Los cambios se aplican al momento y se guardan en tu cuenta." onClose={onClose}>
      <div className="space-y-6">
        <Section title="Apariencia">
          <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-sunken p-1">
            {THEMES.map((t) => (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={pref === t.value}
                data-autofocus={pref === t.value ? '' : undefined}
                onClick={() => setPref(t.value)}
                className={`rounded-lg py-2 text-sm font-medium transition ${pref === t.value ? 'bg-elevated text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
