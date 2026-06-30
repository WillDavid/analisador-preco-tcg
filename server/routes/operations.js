import { Router } from 'express'
import { randomUUID } from 'crypto'
import { getDb, saveDb } from '../db.js'

const router = Router()

function queryAll(sql, params = []) {
  const db = getDb()
  try {
    const stmt = db.prepare(sql)
    if (params.length > 0) {
      stmt.bind(params)
    }
    const rows = []
    while (stmt.step()) {
      rows.push(stmt.getAsObject())
    }
    stmt.free()
    return rows
  } catch {
    return []
  }
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params)
  return rows[0] || null
}

function formatOp(r) {
  if (!r) return null
  return {
    id: r.id,
    referenceDate: r.reference_date,
    filename: r.filename,
    fileHash: r.file_hash,
    importedAt: r.imported_at,
    totals: r.totals_json ? JSON.parse(r.totals_json) : null
  }
}

router.get('/', (_req, res) => {
  const rows = queryAll('SELECT * FROM operations ORDER BY reference_date ASC')
  res.json(rows.map(formatOp))
})

router.get('/:id', (req, res) => {
  const row = queryOne('SELECT * FROM operations WHERE id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(formatOp(row))
})

router.post('/', (req, res) => {
  const { referenceDate, filename, fileHash, totals, entries } = req.body
  const id = randomUUID()
  const importedAt = new Date().toISOString()
  const db = getDb()

  try {
    db.run('BEGIN')
    db.run('DELETE FROM operations WHERE reference_date = ?', [referenceDate])
    db.run(
      'INSERT INTO operations (id, reference_date, filename, file_hash, imported_at, totals_json) VALUES (?, ?, ?, ?, ?, ?)',
      [id, referenceDate, filename || '', fileHash || null, importedAt, JSON.stringify(totals || null)]
    )

    for (const e of (entries || [])) {
      db.run(
        `INSERT INTO entries (id, operation_id, reference_date, unique_key,
          category, reference, name, level, language, state, notes, quantity,
          entry_min, entry_avg, entry_max, exit_min, exit_avg, exit_max)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          randomUUID(),
          id, referenceDate, e.uniqueKey,
          e.category || null, e.reference || null, e.name || null,
          e.level || null, e.language || null, e.state || null,
          e.notes || null, e.quantity || 1,
          e.entry_min ?? null, e.entry_avg ?? null, e.entry_max ?? null,
          e.exit_min ?? null, e.exit_avg ?? null, e.exit_max ?? null
        ]
      )
    }

    db.run('COMMIT')
    saveDb()
    res.json({ id, referenceDate, importedAt, entriesCount: entries?.length || 0 })
  } catch (err) {
    try { db.run('ROLLBACK') } catch {}
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', (req, res) => {
  const db = getDb()
  db.run('DELETE FROM operations WHERE id = ?', [req.params.id])
  saveDb()
  const remaining = queryOne('SELECT id FROM operations WHERE id = ?', [req.params.id])
  res.json({ deleted: !remaining })
})

export default router
