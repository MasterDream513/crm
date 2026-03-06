import { Hono } from 'hono'
import { prisma } from '../../lib/prisma.js'
import { authMiddleware } from '../../middleware/auth.js'

export const settingsRoutes = new Hono()
settingsRoutes.use('*', authMiddleware)

settingsRoutes.get('/', async (c) => {
  const { tenantId } = c.get('user')
  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } })
  return c.json(settings ?? { churnThresholdDays: 90, maCpsMarginRate: 0.60 })
})

export const integrationsRoutes = new Hono()
integrationsRoutes.use('*', authMiddleware)

integrationsRoutes.get('/', async (c) => {
  const { tenantId } = c.get('user')
  const integrations = await prisma.integration.findMany({ where: { tenantId } })
  return c.json(integrations)
})
