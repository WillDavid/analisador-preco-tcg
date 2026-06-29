import { generateId } from '@/utils/identifiers.js'

const STORAGE_IMPORTS = 'pokemon_imports'
const STORAGE_PRICE_HISTORY = 'pokemon_price_history'
const STORAGE_SETTINGS = 'pokemon_settings'

export function getImports() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_IMPORTS) || '[]')
  } catch {
    return []
  }
}

export function saveImport(importData) {
  const imports = getImports()
  imports.push(importData)
  localStorage.setItem(STORAGE_IMPORTS, JSON.stringify(imports))
}

export function getImportById(id) {
  return getImports().find(i => i.id === id) || null
}

export function getImportByDate(referenceDate) {
  return getImports().find(i => i.referenceDate === referenceDate) || null
}

export function getImportByHash(fileHash) {
  return getImports().find(i => i.fileHash === fileHash) || null
}

export function deleteImport(id) {
  const imports = getImports().filter(i => i.id !== id)
  localStorage.setItem(STORAGE_IMPORTS, JSON.stringify(imports))
  const history = getPriceHistory().filter(h => h.importId !== id)
  localStorage.setItem(STORAGE_PRICE_HISTORY, JSON.stringify(history))
}

export function getPriceHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_PRICE_HISTORY) || '[]')
  } catch {
    return []
  }
}

export function savePriceHistory(records) {
  const existing = getPriceHistory()
  existing.push(...records)
  localStorage.setItem(STORAGE_PRICE_HISTORY, JSON.stringify(existing))
}

export function getPriceHistoryByImportId(importId) {
  return getPriceHistory().filter(h => h.importId === importId)
}

export function getPriceHistoryByKey(uniqueKey) {
  return getPriceHistory().filter(h => h.uniqueKey === uniqueKey)
}

export function getDistinctCards() {
  const history = getPriceHistory()
  const map = new Map()
  for (const h of history) {
    if (!map.has(h.uniqueKey)) {
      map.set(h.uniqueKey, {
        ...h,
        firstSeen: h.referenceDate,
        lastSeen: h.referenceDate
      })
    } else {
      const existing = map.get(h.uniqueKey)
      if (h.referenceDate < existing.firstSeen) existing.firstSeen = h.referenceDate
      if (h.referenceDate > existing.lastSeen) existing.lastSeen = h.referenceDate
    }
  }
  return Array.from(map.values())
}

export function getLatestPriceHistory() {
  const imports = getImports()
  if (imports.length === 0) return []
  imports.sort((a, b) => a.referenceDate.localeCompare(b.referenceDate))
  const latest = imports[imports.length - 1]
  return getPriceHistoryByImportId(latest.id)
}

export function getPreviousPriceHistory() {
  const imports = getImports()
  if (imports.length < 2) return []
  imports.sort((a, b) => a.referenceDate.localeCompare(b.referenceDate))
  const prev = imports[imports.length - 2]
  return getPriceHistoryByImportId(prev.id)
}

export function getSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_SETTINGS) || '{}')
  } catch {
    return {}
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings))
}

export function createImportRecord({ referenceDate, filename, fileHash, totals, cardsData }) {
  const importId = generateId()
  const importRecord = {
    id: importId,
    referenceDate,
    filename,
    fileHash,
    importedAt: new Date().toISOString(),
    totals
  }
  const historyRecords = cardsData.map(card => ({
    importId,
    referenceDate,
    uniqueKey: card.uniqueKey,
    edition: card.edition || '',
    number: card.number || '',
    name: card.name || card.namePt || '',
    rarity: card.rarity || '',
    language: card.language || '',
    condition: card.condition || '',
    extra: card.extra || 'Normal',
    quantity: card.quantity || 1,
    prices: {
      buyMin: card.buyMin ?? null,
      buyAvg: card.buyAvg ?? null,
      buyMax: card.buyMax ?? null,
      sellMin: card.sellMin ?? null,
      sellAvg: card.sellAvg ?? null,
      sellMax: card.sellMax ?? null
    }
  }))
  return { importRecord, historyRecords }
}

export function exportAllData() {
  return {
    imports: getImports(),
    priceHistory: getPriceHistory(),
    settings: getSettings(),
    exportedAt: new Date().toISOString()
  }
}

export function importAllData(data) {
  if (!data || !data.imports || !data.priceHistory) {
    throw new Error('Arquivo de backup inválido')
  }
  localStorage.setItem(STORAGE_IMPORTS, JSON.stringify(data.imports))
  localStorage.setItem(STORAGE_PRICE_HISTORY, JSON.stringify(data.priceHistory))
  if (data.settings) {
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(data.settings))
  }
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_IMPORTS)
  localStorage.removeItem(STORAGE_PRICE_HISTORY)
  localStorage.removeItem(STORAGE_SETTINGS)
}
