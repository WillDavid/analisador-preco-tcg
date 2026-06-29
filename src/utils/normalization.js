export function normalizeStr(str) {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-|/]/g, '')
    .trim()
}

export function createUniqueKey(edition, number, language, condition, extra) {
  const e = normalizeStr(edition || '')
  const n = normalizeStr(number || '')
  const l = normalizeStr(language || '')
  const c = normalizeStr(condition || '')
  const ex = normalizeStr(extra || 'normal')
  return `${e}|${n}|${l}|${c}|${ex}`
}
