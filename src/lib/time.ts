/** Fecha local en formato YYYY-MM-DD */
export const dayKey = (d = new Date()) => d.toLocaleDateString('sv')

export const uid = () => crypto.randomUUID()

export const formatMinutes = (min: number) => {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

export const timeAgo = (at: number) => {
  const s = Math.round((Date.now() - at) / 1000)
  if (s < 60) return 'ahora'
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`
  return new Date(at).toLocaleDateString('es', { day: 'numeric', month: 'short' })
}
