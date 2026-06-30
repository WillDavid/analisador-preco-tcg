import { generateId } from '@/utils/identifiers.js'

const STORAGE_IMPORTS = 'data_imports'
const STORAGE_PRICE_HISTORY = 'data_price_history'
const STORAGE_SETTINGS = 'data_settings'

const OLD_IMPORTS = 'pokemon_imports'
const OLD_PRICE_HISTORY = 'pokemon_price_history'
const OLD_SETTINGS = 'pokemon_settings'

function migrate() {
  try {
    if (!localStorage.getItem(STORAGE_IMPORTS) && localStorage.getItem(OLD_IMPORTS)) {
      localStorage.setItem(STORAGE_IMPORTS, localStorage.getItem(OLD_IMPORTS))
      localStorage.setItem(STORAGE_PRICE_HISTORY, localStorage.getItem(OLD_PRICE_HISTORY) || '[]')
      localStorage.setItem(STORAGE_SETTINGS, localStorage.getItem(OLD_SETTINGS) || '{}')
    }
  } catch { /* ignore */ }
}

migrate()

let _apiAvailable = null

async function apiAvailable() {
  if (_apiAvailable !== null) return _apiAvailable
  try {
    const res = await fetch('/api/health')
    _apiAvailable = res.ok
    if (_apiAvailable) await tryMigrate()
  } catch {
    _apiAvailable = false
  }
  return _apiAvailable
}

async function tryMigrate() {
  const localImports = localStorage.getItem(STORAGE_IMPORTS)
    || localStorage.getItem('pokemon_imports')
  if (!localImports) return

  try {
    const res = await fetch('/api/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imports: JSON.parse(localStorage.getItem(STORAGE_IMPORTS) || localStorage.getItem('pokemon_imports') || '[]'),
        priceHistory: JSON.parse(localStorage.getItem(STORAGE_PRICE_HISTORY) || localStorage.getItem('pokemon_price_history') || '[]'),
        settings: JSON.parse(localStorage.getItem(STORAGE_SETTINGS) || localStorage.getItem('pokemon_settings') || '{}')
      })
    })
    const result = await res.json()
    if (result.migrated) {
      console.log(`[migrate] Dados migrados para o banco: ${result.operations} operacoes, ${result.entries} entradas`)
    }
  } catch { /* ignore migration errors */ }
}

function apiPost(path, body) {
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(r => r.json())
}

function apiDelete(path) {
  return fetch(path, { method: 'DELETE' }).then(r => r.json())
}

// --- Operacoes ---

export async function getImports() {
  if (await apiAvailable()) {
    return fetch('/api/operations').then(r => r.json())
  }
  try { return JSON.parse(localStorage.getItem(STORAGE_IMPORTS) || '[]') } catch { return [] }
}

export async function saveImport(importData, entries) {
  if (await apiAvailable()) {
    const body = { ...importData, entries: entries || [] }
    await apiPost('/api/operations', body)
    return
  }
  const imports = await getImports()
  imports.push(importData)
  localStorage.setItem(STORAGE_IMPORTS, JSON.stringify(imports))
}

export async function getImportById(id) {
  const imports = await getImports()
  return imports.find(i => i.id === id) || null
}

export async function getImportByDate(referenceDate) {
  const imports = await getImports()
  return imports.find(i => i.referenceDate === referenceDate) || null
}

export async function getImportByHash(fileHash) {
  const imports = await getImports()
  return imports.find(i => i.fileHash === fileHash) || null
}

export async function deleteImport(id) {
  if (await apiAvailable()) {
    await apiDelete(`/api/operations/${id}`)
    return
  }
  const imports = (await getImports()).filter(i => i.id !== id)
  localStorage.setItem(STORAGE_IMPORTS, JSON.stringify(imports))
  const history = (await getPriceHistory()).filter(h => h.importId !== id)
  localStorage.setItem(STORAGE_PRICE_HISTORY, JSON.stringify(history))
}

// --- Historico de precos ---

export async function getPriceHistory() {
  if (await apiAvailable()) {
    return fetch('/api/entries').then(r => r.json())
  }
  try { return JSON.parse(localStorage.getItem(STORAGE_PRICE_HISTORY) || '[]') } catch { return [] }
}

export async function savePriceHistory(records) {
  if (await apiAvailable()) return
  const existing = await getPriceHistory()
  existing.push(...records)
  localStorage.setItem(STORAGE_PRICE_HISTORY, JSON.stringify(existing))
}

export async function saveFullImport(importRecord, historyRecords) {
  if (await apiAvailable()) {
    const entries = historyRecords.map(r => ({
      uniqueKey: r.uniqueKey,
      category: r.edition || null,
      reference: r.number || null,
      name: r.name || null,
      level: r.rarity || null,
      language: r.language || null,
      state: r.condition || null,
      notes: r.extra || null,
      quantity: r.quantity || 1,
      entry_min: r.prices?.buyMin ?? null,
      entry_avg: r.prices?.buyAvg ?? null,
      entry_max: r.prices?.buyMax ?? null,
      exit_min: r.prices?.sellMin ?? null,
      exit_avg: r.prices?.sellAvg ?? null,
      exit_max: r.prices?.sellMax ?? null
    }))
    return apiPost('/api/operations', {
      referenceDate: importRecord.referenceDate,
      filename: importRecord.filename,
      fileHash: importRecord.fileHash,
      totals: importRecord.totals,
      entries
    })
  }
  saveImport(importRecord)
  savePriceHistory(historyRecords)
}

export async function getPriceHistoryByImportId(importId) {
  if (await apiAvailable()) {
    return fetch(`/api/entries?operation_id=${importId}`).then(r => r.json())
  }
  return (await getPriceHistory()).filter(h => h.importId === importId)
}

export async function getPriceHistoryByKey(uniqueKey) {
  if (await apiAvailable()) {
    return fetch(`/api/entries/by-key/${encodeURIComponent(uniqueKey)}`).then(r => r.json())
  }
  return (await getPriceHistory()).filter(h => h.uniqueKey === uniqueKey)
}

export async function getDistinctCards() {
  const history = await getPriceHistory()
  const map = new Map()
  for (const h of history) {
    if (!map.has(h.uniqueKey)) {
      map.set(h.uniqueKey, { ...h, firstSeen: h.referenceDate, lastSeen: h.referenceDate })
    } else {
      const existing = map.get(h.uniqueKey)
      if (h.referenceDate < existing.firstSeen) existing.firstSeen = h.referenceDate
      if (h.referenceDate > existing.lastSeen) existing.lastSeen = h.referenceDate
    }
  }
  return Array.from(map.values())
}

export async function getLatestPriceHistory() {
  if (await apiAvailable()) {
    return fetch('/api/entries/latest').then(r => r.json())
  }
  const imports = await getImports()
  if (imports.length === 0) return []
  imports.sort((a, b) => a.referenceDate.localeCompare(b.referenceDate))
  const latest = imports[imports.length - 1]
  return getPriceHistoryByImportId(latest.id)
}

export async function getPreviousPriceHistory() {
  if (await apiAvailable()) {
    return fetch('/api/entries/previous').then(r => r.json())
  }
  const imports = await getImports()
  if (imports.length < 2) return []
  imports.sort((a, b) => a.referenceDate.localeCompare(b.referenceDate))
  const prev = imports[imports.length - 2]
  return getPriceHistoryByImportId(prev.id)
}

// --- Settings ---

export async function getSettings() {
  if (await apiAvailable()) {
    return fetch('/api/settings').then(r => r.json())
  }
  try { return JSON.parse(localStorage.getItem(STORAGE_SETTINGS) || '{}') } catch { return {} }
}

export async function saveSettings(settings) {
  if (await apiAvailable()) {
    return fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
  }
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings))
}

// --- Factory ---

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

// --- Backup ---

export async function exportAllData() {
  if (await apiAvailable()) {
    const [imports, allEntries, settings] = await Promise.all([
      fetch('/api/operations').then(r => r.json()),
      fetch('/api/entries').then(r => r.json()),
      fetch('/api/settings').then(r => r.json())
    ])
    return { imports, priceHistory: allEntries, settings, exportedAt: new Date().toISOString() }
  }
  return {
    imports: await getImports(),
    priceHistory: await getPriceHistory(),
    settings: await getSettings(),
    exportedAt: new Date().toISOString()
  }
}

export function importAllData(data) {
  if (!data || !data.imports || !data.priceHistory) {
    throw new Error('Arquivo de backup invalido')
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
