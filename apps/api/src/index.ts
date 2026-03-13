import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authRoutes } from './routes/v1/auth.js'
import { customerRoutes } from './routes/v1/customers.js'
import { prospectRoutes } from './routes/v1/prospects.js'
import { transactionRoutes } from './routes/v1/transactions.js'
import { productRoutes } from './routes/v1/products.js'
import { expenseRoutes } from './routes/v1/expenses.js'
import { followLogRoutes } from './routes/v1/follow-logs.js'
import { kpiRoutes } from './routes/v1/kpi.js'
import { referralRoutes } from './routes/v1/referrals.js'
import { eventRoutes } from './routes/v1/events.js'
import { utageWebhookRoutes } from './routes/v1/webhooks/utage.js'
import { marketingFunnelRoutes } from './routes/v1/marketing-funnel.js'
import { settingsRoutes, integrationsRoutes } from './routes/v1/settings.js'

const app = new Hono()

// ── Middleware ──────────────────────────────────────────────
app.use('*', logger())
app.use(
  '*',
  cors({
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:8080'],
    credentials: true,
  })
)

// ── Health ──────────────────────────────────────────────────
app.get('/health', async (c) => {
  const diag: Record<string, unknown> = { status: 'ok', ts: new Date().toISOString() }

  // Show masked DATABASE_URL for debugging
  const dbUrl = process.env.DATABASE_URL ?? '(not set)'
  diag.dbUrlPreview = dbUrl.replace(/:[^@]+@/, ':***@')

  // DNS lookup test
  try {
    const { promises: dns } = await import('dns')
    const host = dbUrl.match(/@([^:\/]+)/)?.[1] ?? ''
    diag.dnsHost = host
    const addresses = await dns.resolve4(host)
    diag.dnsResult = addresses
  } catch (err) {
    diag.dnsError = String(err)
  }

  // TCP connect test
  try {
    const net = await import('net')
    const host = dbUrl.match(/@([^:\/]+)/)?.[1] ?? ''
    const port = Number(dbUrl.match(/:(\d+)\//)?.[1] ?? 5432)
    diag.tcpTarget = `${host}:${port}`
    await new Promise<void>((resolve, reject) => {
      const sock = net.createConnection({ host, port, timeout: 5000 }, () => {
        diag.tcpConnect = 'ok'
        sock.destroy()
        resolve()
      })
      sock.on('error', (err) => { diag.tcpConnect = 'error'; diag.tcpError = String(err); reject(err) })
      sock.on('timeout', () => { diag.tcpConnect = 'timeout'; sock.destroy(); reject(new Error('timeout')) })
    })
  } catch (_) { /* already logged */ }

  // Prisma test
  try {
    const { prisma } = await import('./lib/prisma.js')
    await prisma.$queryRaw`SELECT 1`
    diag.db = 'connected'
  } catch (err) {
    diag.db = 'error'
    diag.dbError = String(err)
  }

  return c.json(diag)
})

// ── API v1 ──────────────────────────────────────────────────
const v1 = new Hono()
v1.route('/auth', authRoutes)
v1.route('/customers', customerRoutes)
v1.route('/prospects', prospectRoutes)
v1.route('/transactions', transactionRoutes)
v1.route('/products', productRoutes)
v1.route('/expenses', expenseRoutes)
v1.route('/follow-logs', followLogRoutes)
v1.route('/kpi', kpiRoutes)
v1.route('/referrals', referralRoutes)
v1.route('/events', eventRoutes)
v1.route('/marketing-funnel', marketingFunnelRoutes)
v1.route('/webhooks/utage', utageWebhookRoutes)
v1.route('/settings', settingsRoutes)
v1.route('/integrations', integrationsRoutes)

app.route('/api/v1', v1)

// ── Start ───────────────────────────────────────────────────
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001)
console.log(`🚀 API running on http://localhost:${port}`)
serve({ fetch: app.fetch, port })
