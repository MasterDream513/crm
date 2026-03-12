import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { authMiddleware } from '../../middleware/auth.js'

export const settingsRoutes = new Hono()
settingsRoutes.use('*', authMiddleware)

settingsRoutes.get('/', async (c) => {
  const { tenantId } = c.get('user')
  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } })
  return c.json(settings ?? { churnThresholdDays: 90, maCpsMarginRate: 0.60 })
})

const settingsUpdateSchema = z.object({
  churnThresholdDays: z.number().int().min(1).max(365).optional(),
  maCpsMarginRate: z.number().min(0.01).max(1.0).optional(),
  currency: z.string().min(1).optional(),
  timezone: z.string().min(1).optional(),
})

settingsRoutes.patch('/', zValidator('json', settingsUpdateSchema), async (c) => {
  const { tenantId } = c.get('user')
  const data = c.req.valid('json')
  const settings = await prisma.tenantSettings.upsert({
    where: { tenantId },
    update: data,
    create: { tenantId, ...data },
  })
  return c.json(settings)
})

export const integrationsRoutes = new Hono()
integrationsRoutes.use('*', authMiddleware)

integrationsRoutes.get('/', async (c) => {
  const { tenantId } = c.get('user')
  const integrations = await prisma.integration.findMany({ where: { tenantId } })
  return c.json(integrations)
})
