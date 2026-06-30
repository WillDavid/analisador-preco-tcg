import { Router } from 'express'
import { exec } from 'child_process'
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

router.get('/status', (_req, res) => {
  const ops = queryAll('SELECT COUNT(*) as total FROM operations')
  const entries = queryAll('SELECT COUNT(*) as total FROM entries')
  const lastOp = queryAll('SELECT reference_date, imported_at FROM operations ORDER BY reference_date DESC LIMIT 1')

  res.json({
    operations: ops[0]?.total || 0,
    entries: entries[0]?.total || 0,
    lastImport: lastOp[0]?.reference_date || null,
    lastImportedAt: lastOp[0]?.imported_at || null
  })
})

router.post('/pull', (_req, res) => {
  exec('git pull', { timeout: 15000 }, (err, stdout, stderr) => {
    const output = (stdout + stderr).trim()

    if (err) {
      return res.json({
        success: false,
        message: output || err.message
      })
    }

    const ops = queryAll('SELECT COUNT(*) as total FROM operations')
    const entries = queryAll('SELECT COUNT(*) as total FROM entries')
    const lastOp = queryAll('SELECT reference_date FROM operations ORDER BY reference_date DESC LIMIT 1')

    res.json({
      success: true,
      message: output || 'Repositorio atualizado',
      operations: ops[0]?.total || 0,
      entries: entries[0]?.total || 0,
      lastImport: lastOp[0]?.reference_date || null
    })
  })
})

export default router
