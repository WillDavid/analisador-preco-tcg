import initSqlJs from 'sql.js'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data')
const DB_PATH = join(DATA_DIR, 'app.db')

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

let db

export async function initDb() {
  if (db) return db

  const SQL = await initSqlJs()

  let buffer
  if (existsSync(DB_PATH)) {
    buffer = readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run('PRAGMA foreign_keys = ON')

  db.run(`
    CREATE TABLE IF NOT EXISTS operations (
      id             TEXT PRIMARY KEY,
      reference_date TEXT NOT NULL,
      filename       TEXT,
      file_hash      TEXT,
      imported_at    TEXT NOT NULL,
      totals_json    TEXT
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS entries (
      id             TEXT PRIMARY KEY,
      operation_id   TEXT NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
      reference_date TEXT NOT NULL,
      unique_key     TEXT NOT NULL,
      category       TEXT,
      reference      TEXT,
      name           TEXT,
      level          TEXT,
      language       TEXT,
      state          TEXT,
      notes          TEXT,
      quantity       INTEGER DEFAULT 1,
      entry_min      REAL,
      entry_avg      REAL,
      entry_max      REAL,
      exit_min       REAL,
      exit_avg       REAL,
      exit_max       REAL
    )
  `)
  db.run('CREATE INDEX IF NOT EXISTS idx_entries_op ON entries(operation_id)')
  db.run('CREATE INDEX IF NOT EXISTS idx_entries_key ON entries(unique_key)')
  db.run('CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(reference_date)')
  db.run(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    )
  `)

  if (!buffer) {
    migrateFromLocalStorage(db)
  }

  return db
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.')
  return db
}

export function saveDb() {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  writeFileSync(DB_PATH, buffer)
}

function migrateFromLocalStorage(database) {
  const result = database.exec('SELECT COUNT(*) as c FROM operations')
  if (result.length && result[0].values[0][0] > 0) return

  try {
    const lsImports = globalThis.localStorage?.getItem('data_imports')
      || globalThis.localStorage?.getItem('pokemon_imports')
    const lsHistory = globalThis.localStorage?.getItem('data_price_history')
      || globalThis.localStorage?.getItem('pokemon_price_history')
    const lsSettings = globalThis.localStorage?.getItem('data_settings')
      || globalThis.localStorage?.getItem('pokemon_settings')

    if (!lsImports) return

    const imports = JSON.parse(lsImports)
    const history = JSON.parse(lsHistory || '[]')
    const settings = JSON.parse(lsSettings || '{}')

    database.run('BEGIN')
    for (const imp of imports) {
      database.run(
        'INSERT INTO operations (id, reference_date, filename, file_hash, imported_at, totals_json) VALUES (?, ?, ?, ?, ?, ?)',
        [imp.id, imp.referenceDate, imp.filename || '', imp.fileHash || null, imp.importedAt, JSON.stringify(imp.totals || null)]
      )
    }
    for (const h of history) {
      database.run(
        `INSERT INTO entries (id, operation_id, reference_date, unique_key,
          category, reference, name, level, language, state, notes, quantity,
          entry_min, entry_avg, entry_max, exit_min, exit_avg, exit_max)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          h.importId + '_' + h.uniqueKey,
          h.importId, h.referenceDate, h.uniqueKey,
          h.edition || null, h.number || null, h.name || null,
          h.rarity || null, h.language || null, h.condition || null,
          h.extra || null, h.quantity || 1,
          h.prices?.buyMin ?? null, h.prices?.buyAvg ?? null, h.prices?.buyMax ?? null,
          h.prices?.sellMin ?? null, h.prices?.sellAvg ?? null, h.prices?.sellMax ?? null
        ]
      )
    }
    for (const [k, v] of Object.entries(settings)) {
      database.run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [k, String(v)])
    }
    database.run('COMMIT')

    saveDb()
    console.log(`[db] Migrado do localStorage: ${imports.length} operacoes, ${history.length} entradas`)
  } catch (e) {
    try { database.run('ROLLBACK') } catch {}
    console.error('[db] Erro na migracao do localStorage:', e.message)
  }
}
