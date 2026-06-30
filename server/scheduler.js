import { scrapeCollection } from './scraper.js'
import { getDb, saveDb } from './db.js'
import { randomUUID } from 'crypto'
import { createUniqueKey } from '../src/utils/normalization.js'

let timer = null
let running = false
let paused = false
let lastError = null
let lastScrape = null
let config = { url: '', interval: 5 * 60 * 1000 }

function queryAll(sql, params = []) {
  const db = getDb()
  try {
    const result = db.exec(sql, params)
    if (!result.length) return []
    const { columns, values } = result[0]
    return values.map(row => {
      const obj = {}
      columns.forEach((col, i) => { obj[col] = row[i] })
      return obj
    })
  } catch {
    return []
  }
}

function loadConfig() {
  const rows = queryAll('SELECT key, value FROM app_settings WHERE key IN (?, ?)', ['scrape_url', 'scrape_interval'])
  for (const r of rows) {
    if (r.key === 'scrape_url') config.url = r.value
    if (r.key === 'scrape_interval') config.interval = parseInt(r.value) || 5 * 60 * 1000
  }
}

function saveConfig() {
  const db = getDb()
  db.run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', ['scrape_url', config.url])
  db.run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', ['scrape_interval', String(config.interval)])
  saveDb()
}

export function getStatus() {
  return {
    url: config.url,
    interval: config.interval,
    running,
    paused,
    lastScrape,
    lastError
  }
}

export function setConfig(url, intervalMs) {
  config.url = url
  if (intervalMs) config.interval = intervalMs
  saveConfig()
}

export function setPaused(p) {
  paused = p
}

export async function forceScrape() {
  if (!config.url) throw new Error('URL nao configurada')
  return doScrape()
}

async function doScrape() {
  if (running) return { skipped: true }
  running = true
  lastError = null

  try {
    const { cards, totals } = await scrapeCollection(config.url)
    const db = getDb()
    const refDate = new Date().toISOString().split('T')[0]
    const importId = randomUUID()
    const now = new Date().toISOString()

    db.run('BEGIN')
    db.run(
      'INSERT INTO operations (id, reference_date, filename, file_hash, imported_at, totals_json) VALUES (?, ?, ?, ?, ?, ?)',
      [importId, refDate, 'scrape', null, now, JSON.stringify(totals)]
    )

    for (const card of cards) {
      const key = createUniqueKey(card.edition, card.number, card.language, card.condition, card.extra)
      db.run(
        `INSERT INTO entries (id, operation_id, reference_date, unique_key,
          category, reference, name, level, language, state, notes, quantity,
          entry_min, entry_avg, entry_max, exit_min, exit_avg, exit_max)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [randomUUID(), importId, refDate, key,
          card.edition || null, card.number || null, card.namePt || null,
          card.rarity || null, card.language || null, card.condition || null,
          card.extra || null, card.quantity || 1,
          card.buyMin ?? null, card.buyAvg ?? null, card.buyMax ?? null,
          card.sellMin ?? null, card.sellAvg ?? null, card.sellMax ?? null]
      )
    }

    db.run('COMMIT')

    const count = db.exec('SELECT COUNT(*) as c FROM operations')[0].values[0][0]
    if (count > 500) {
      const oldest = db.exec('SELECT id FROM operations ORDER BY reference_date ASC LIMIT 1')[0].values[0][0]
      db.run('DELETE FROM operations WHERE id = ?', [oldest])
    }

    saveDb()
    lastScrape = { time: now, cards: cards.length, totals }
    return { cards: cards.length, totals }
  } catch (err) {
    lastError = err.message
    throw err
  } finally {
    running = false
  }
}

export function start() {
  loadConfig()
  if (timer) clearInterval(timer)

  if (config.url) {
    doScrape().catch(() => {})
    timer = setInterval(() => {
      if (!paused) doScrape().catch(() => {})
    }, config.interval)
  }

  console.log(`[scheduler] Intervalo: ${config.interval / 1000}s, URL: ${config.url || '(nao configurada)'}`)
}

export function stop() {
  if (timer) { clearInterval(timer); timer = null }
}
