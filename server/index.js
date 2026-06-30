import express from 'express'
import cors from 'cors'
import { initDb } from './db.js'
import { start as startScheduler, stop as stopScheduler } from './scheduler.js'
import operationsRouter from './routes/operations.js'
import entriesRouter from './routes/entries.js'
import settingsRouter from './routes/settings.js'
import syncRouter from './routes/sync.js'
import migrateRouter from './routes/migrate.js'
import scrapeRouter from './routes/scrape.js'

const app = express()
const PORT = process.env.API_PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.use('/api/operations', operationsRouter)
app.use('/api/entries', entriesRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/sync', syncRouter)
app.use('/api/migrate', migrateRouter)
app.use('/api/scrape', scrapeRouter)
app.get('/api/health', (_req, res) => res.json({ ok: true }))

async function start() {
  await initDb()
  startScheduler()
  app.listen(PORT, () => {
    console.log(`[api] http://localhost:${PORT}`)
  })
}

start()

process.on('SIGINT', () => { stopScheduler(); process.exit() })
process.on('SIGTERM', () => { stopScheduler(); process.exit() })
