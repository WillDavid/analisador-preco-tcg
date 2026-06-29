export function parseBrazilianCurrency(value) {
  if (value === null || value === undefined || value === '') return null
  let str = String(value).trim()
  str = str.replace(/R\$/gi, '')
  str = str.replace(/\s/g, '')
  if (!str) return null
  if (/^\d{1,3}(\.\d{3})*,\d+$/.test(str) || str.includes('.')) {
    str = str.replace(/\./g, '')
  }
  str = str.replace(',', '.')
  const num = parseFloat(str)
  return isNaN(num) ? null : num
}

export function formatBrazilianCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatPercent(value) {
  if (value === null || value === undefined || isNaN(value)) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100)
}
