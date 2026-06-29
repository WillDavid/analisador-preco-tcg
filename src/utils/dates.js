export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function todayStr() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

export function daysBetween(d1, d2) {
  const a = new Date(d1 + 'T12:00:00')
  const b = new Date(d2 + 'T12:00:00')
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}
