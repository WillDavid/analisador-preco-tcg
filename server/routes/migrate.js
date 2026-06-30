import { Router } from 'express'
import { getDb, saveDb } from '../db.js'

const router = Router()

router.post('/', (req, res) => {
  const { imports, priceHistory, settings } = req.body
  const db = getDb()

  const existing = db.exec('SELECT COUNT(*) as c FROM operations')
  if (existing.length && existing[0].values[0][0] > 0) {
    return res.json({ migrated: false, reason: 'Database already has data' })
  }

  if (!imports) return res.status(400).json({ error: 'No imports data' })

  try {
    db.run('BEGIN')
    for (const imp of imports) {
      db.run(
        'INSERT INTO operations (id, reference_date, filename, file_hash, imported_at, totals_json) VALUES (?, ?, ?, ?, ?, ?)',
        [imp.id, imp.referenceDate, imp.filename || '', imp.fileHash || null, imp.importedAt || new Date().toISOString(), JSON.stringify(imp.totals || null)]
      )
    }
    for (const h of (priceHistory || [])) {
      db.run(
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
    for (const [k, v] of Object.entries(settings || {})) {
      db.run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [k, String(v)])
    }
    db.run('COMMIT')
    saveDb()

    const total = imports.length + (priceHistory?.length || 0)
    console.log(`[migrate] Importado: ${imports.length} operacoes, ${priceHistory?.length || 0} entradas`)
    res.json({ migrated: true, operations: imports.length, entries: priceHistory?.length || 0, total })
  } catch (err) {
    try { db.run('ROLLBACK') } catch {}
    res.status(500).json({ error: err.message })
  }
})

export default router
