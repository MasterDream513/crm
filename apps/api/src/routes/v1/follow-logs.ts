import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { authMiddleware } from '../../middleware/auth.js'

export const followLogRoutes = new Hono()
followLogRoutes.use('*', authMiddleware)

const followLogSchema = z.object({
  customerId: z.string().uuid().optional(),
  prospectId: z.string().uuid().optional(),
  type: z.enum(['CALL', 'LINE', 'MEETING', 'EMAIL', 'LETTER', 'OTHER']),
  logDate: z.string().datetime(),
  notes: z.string().optional(),
  outcome: z.string().optional(),
  nextAction: z.string().optional(),
  nextDueDate: z.string().datetime().optional(),
})

followLogRoutes.post('/', zValidator('json', followLogSchema), async (c) => {
  const { tenantId, id: userId } = c.get('user')
  const data = c.req.valid('json')
  const log = await prisma.followLog.create({
    data: {
      tenantId,
      userId,
      ...data,
      logDate: new Date(data.logDate),
      nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : undefined,
    },
  })
  return c.json(log, 201)
})

followLogRoutes.get('/', async (c) => {
  const { tenantId } = c.get('user')
  const { customerId, prospectId, overdue } = c.req.query()

  const now = new Date()
  const logs = await prisma.followLog.findMany({
    where: {
      tenantId,
      deletedAt: null,
      ...(customerId ? { customerId } : {}),
      ...(prospectId ? { prospectId } : {}),
      ...(overdue === 'true' ? { nextDueDate: { lt: now } } : {}),
    },
    orderBy: { logDate: 'desc' },
  })
  return c.json(logs)
})

// Count of follow logs entered today (A案: "today's existing customers handled")
followLogRoutes.get('/today-count', async (c) => {
  const { tenantId } = c.get('user')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const count = await prisma.followLog.count({
    where: {
      tenantId,
      deletedAt: null,
      logDate: { gte: today },
      customerId: { not: null }, // only existing customers (not prospects)
    },
  })
  return c.json({ count })
})

// Overdue follow-up count (for dashboard badge)
followLogRoutes.get('/overdue-count', async (c) => {
  const { tenantId } = c.get('user')
  const count = await prisma.followLog.count({
    where: {
      tenantId,
      deletedAt: null,
      nextDueDate: { lt: new Date() },
    },
  })
  return c.json({ count })
})
