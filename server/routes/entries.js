import { Router } from 'express'
import { getDb } from '../db.js'

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

function formatRow(r) {
  if (!r) return null
  return {
    importId: r.operation_id,
    referenceDate: r.reference_date,
    uniqueKey: r.unique_key,
    edition: r.category,
    number: r.reference,
    name: r.name,
    rarity: r.level,
    language: r.language,
    condition: r.state,
    extra: r.notes,
    quantity: r.quantity,
    prices: {
      buyMin: r.entry_min,
      buyAvg: r.entry_avg,
      buyMax: r.entry_max,
      sellMin: r.exit_min,
      sellAvg: r.exit_avg,
      sellMax: r.exit_max
    }
  }
}

router.get('/latest', (_req, res) => {
  const lastOp = queryAll('SELECT id FROM operations ORDER BY reference_date DESC LIMIT 1')
  if (!lastOp.length) return res.json([])
  const rows = queryAll('SELECT * FROM entries WHERE operation_id = ?', [lastOp[0].id])
  res.json(rows.map(formatRow))
})

router.get('/previous', (_req, res) => {
  const ops = queryAll('SELECT id FROM operations ORDER BY reference_date DESC LIMIT 2')
  if (ops.length < 2) return res.json([])
  const rows = queryAll('SELECT * FROM entries WHERE operation_id = ?', [ops[1].id])
  res.json(rows.map(formatRow))
})

router.get('/by-key/:key', (req, res) => {
  const rows = queryAll('SELECT * FROM entries WHERE unique_key = ? ORDER BY reference_date ASC', [req.params.key])
  res.json(rows.map(formatRow))
})

router.get('/', (req, res) => {
  const { operation_id } = req.query
  if (operation_id) {
    const rows = queryAll('SELECT * FROM entries WHERE operation_id = ?', [operation_id])
    return res.json(rows.map(formatRow))
  }
  res.json([])
})

export default router
