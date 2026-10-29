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
          <p className="mt-2 text-xs text-subtle">«Sistema» sigue el modo claro u oscuro de Windows.</p>
        </Section>

        <Section title="Pomodoro">
          <div className="grid grid-cols-3 gap-3">
            <MinutesField label="Enfoque" value={settings.focusMinutes} min={5} max={90} onChange={(v) => set('focusMinutes', v)} />
            <MinutesField label="Pausa" value={settings.shortMinutes} min={1} max={30} onChange={(v) => set('shortMinutes', v)} />
            <MinutesField label="Pausa larga" value={settings.longMinutes} min={5} max={60} onChange={(v) => set('longMinutes', v)} />
          </div>
          <p className="mt-2 text-xs text-subtle">Si el temporizador está en marcha, el cambio se aplica a la siguiente sesión.</p>
        </Section>

        <Section title="IA">
          <label className="block">
            <span className="mb-1.5 block text-sm text-fg-2">Preguntar cómo me siento</span>
            <select
              value={settings.checkInMinutes}
              onChange={(e) => set('checkInMinutes', Number(e.target.value))}
              className="h-10 w-full rounded-lg border border-control bg-sunken px-3 text-sm text-fg outline-none focus:border-accent"
            >
              {CHECK_IN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-fg-2">Activar el bloqueador con carga alta</p>
              <p className="mt-0.5 text-xs text-subtle">Al entrar en Enfoque Absoluto, cierra tus apps de distracción.</p>
            </div>
            <Switch checked={settings.autoBlock} onChange={(v) => set('autoBlock', v)} label="Activar el bloqueador con carga alta" />
          </div>
        </Section>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
        <button type="button" onClick={() => onChange(DEFAULT_SETTINGS)} className={BUTTON_SECONDARY}>
          Restablecer
        </button>
        <button type="button" onClick={onClose} className={BUTTON_PRIMARY}>
          Listo
        </button>
      </div>
    </Dialog>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
