import { useMemo, useState, type KeyboardEvent } from 'react'
import { dayKey, formatMinutes } from '../../lib/time'
import type { FocusLog } from '../../types'
import { Panel } from '../Panel'

const HOURS = Array.from({ length: 24 }, (_, h) => h)

// Escala de 5 pasos: vacío → flujo máximo (los colores cambian con el tema)
const SCALE = ['bg-heat-0', 'bg-heat-1', 'bg-heat-2', 'bg-heat-3', 'bg-heat-4']
const SCALE_LABELS = ['sin flujo', 'menos de 15 min', '15 a 30 min', '30 a 45 min', 'más de 45 min']

const bucket = (min: number) => (min < 1 ? 0 : min < 15 ? 1 : min < 30 ? 2 : min < 45 ? 3 : 4)

/** Últimos 7 días terminando hoy, con los minutos de enfoque por hora */
function lastWeek(log: FocusLog) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const seconds = log[dayKey(d)] ?? []
    return {
      label: d.toLocaleDateString('es', { weekday: 'short' }).replace('.', ''),
      longLabel: d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }),
      isToday: i === 6,
      minutes: HOURS.map((h) => (seconds[h] ?? 0) / 60),
    }
  })
}

const hh = (h: number) => `${String(h).padStart(2, '0')}:00`

export function DeepWorkHeatmap({ className, log }: { className?: string; log: FocusLog }) {
  const week = useMemo(() => lastWeek(log), [log])
  const [cursor, setCursor] = useState<{ d: number; h: number } | null>(null)

  const { totalMin, peakHour } = useMemo(() => {
    const total = week.reduce((s, day) => s + day.minutes.reduce((a, b) => a + b, 0), 0)
    const byHour = HOURS.map((h) => week.reduce((s, day) => s + day.minutes[h], 0))
    const max = Math.max(...byHour)
    return { totalMin: total, peakHour: max > 0 ? byHour.indexOf(max) : null }
  }, [week])

  // Con el teclado: las flechas recorren la cuadrícula (días ↕, horas ↔)
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }
    const move = moves[e.key]
    if (!move) return
    e.preventDefault()
    setCursor((c) => {
      const from = c ?? { d: 6, h: new Date().getHours() }
      return { d: Math.min(6, Math.max(0, from.d + move[0])), h: Math.min(23, Math.max(0, from.h + move[1])) }
    })
  }

  const readout = cursor
    ? `${week[cursor.d].longLabel}, ${hh(cursor.h)}: ${Math.round(week[cursor.d].minutes[cursor.h])} minutos de flujo`
    : peakHour !== null
      ? `Tu mejor franja: ${hh(peakHour)}`
      : 'Sin datos todavía'

  return (
    <Panel
      id="heatmap"
      eyebrow="Analítica · Últimos 7 días"
      title="Mapa de flujo profundo"
      className={className}
      actions={
        <span className="font-mono text-sm font-semibold text-fg" title="Total de enfoque en 7 días">
          {formatMinutes(totalMin)}
        </span>
      }
    >
      <div className="relative">
        <div
          tabIndex={0}
          role="group"
          aria-label="Minutos de enfoque por día y hora. Usa las flechas para recorrerlo."
          onKeyDown={onKeyDown}
          onFocus={() => setCursor((c) => c ?? { d: 6, h: new Date().getHours() })}
          onBlur={() => setCursor(null)}
          onMouseLeave={() => setCursor(null)}
          className="grid grid-cols-[auto_repeat(24,minmax(0,1fr))] gap-[3px] rounded-md"
        >
          <span />
          {HOURS.map((h) => (
            <span key={h} aria-hidden className="pb-1 text-center font-mono text-[11px] text-subtle">
              {h % 6 === 0 ? String(h).padStart(2, '0') : ''}
            </span>
          ))}
          {week.map((day, d) => (
            <div key={d} className="contents">
              <span aria-hidden className={`self-center pr-2 font-mono text-[11px] capitalize leading-none ${day.isToday ? 'font-semibold text-accent' : 'text-muted'}`}>
                {day.label}
              </span>
              {day.minutes.map((min, h) => {
                const active = cursor?.d === d && cursor.h === h
                return (
                  <span
                    key={h}
                    aria-hidden
                    onMouseEnter={() => setCursor({ d, h })}
                    className={`aspect-square rounded-[3px] transition-transform duration-150 ${SCALE[bucket(min)]} ${active ? 'scale-125 ring-2 ring-fg' : ''}`}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {totalMin === 0 && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <p className="rounded-lg border border-line bg-elevated/95 px-4 py-2 text-center text-xs text-muted shadow-[var(--shadow-panel)]">
              Completa tu primera sesión de enfoque
              <br />y aquí verás cuándo fluyes mejor.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <p className="min-h-4 font-mono text-muted" aria-live="polite">
          {readout}
        </p>
        <div className="flex items-center gap-1.5 text-subtle">
          <span>Menos</span>
          {SCALE.map((c, i) => (
            <span key={c} title={SCALE_LABELS[i]} className={`size-3 rounded-[2px] ${c}`} />
          ))}
          <span>Más</span>
        </div>
      </div>
    </Panel>
  )
}
