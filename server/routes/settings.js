import { Router } from 'express'
import { getDb, saveDb } from '../db.js'

const router = Router()

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
