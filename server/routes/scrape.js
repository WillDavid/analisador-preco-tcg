import { Router } from 'express'
import { getStatus, setConfig, setPaused, forceScrape } from '../scheduler.js'

const router = Router()

router.get('/status', (_req, res) => {
  res.json(getStatus())
})

router.post('/config', (req, res) => {
  const { url, intervalMs } = req.body
  setConfig(url, intervalMs)
  res.json({ ok: true, ...getStatus() })
})

router.post('/pause', (_req, res) => {
  setPaused(true)
  res.json(getStatus())
})

router.post('/resume', (_req, res) => {
  setPaused(false)
  res.json(getStatus())
})

router.post('/now', async (_req, res) => {
  try {
    const result = await forceScrape()
    res.json({ ok: true, ...result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
