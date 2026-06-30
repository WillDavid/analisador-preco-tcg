import { Router } from 'express'
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

router.get('/', (_req, res) => {
  const rows = queryAll('SELECT key, value FROM app_settings')
  const obj = {}
  for (const r of rows) obj[r.key] = r.value
  res.json(obj)
})

router.put('/', (req, res) => {
  const db = getDb()
  for (const [k, v] of Object.entries(req.body)) {
    db.run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [k, String(v)])
  }
  saveDb()
  res.json({ ok: true })
})

export default router
