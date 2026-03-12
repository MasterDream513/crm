import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { authMiddleware } from '../../middleware/auth.js'

export const prospectRoutes = new Hono()
prospectRoutes.use('*', authMiddleware)

const prospectSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  acquisitionSource: z.string().optional(),
  stage: z.enum(['LEAD', 'SEMINAR', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).default('LEAD'),
  notes: z.string().optional(),
})

prospectRoutes.get('/', async (c) => {
  const { tenantId } = c.get('user')
  const { q, stage, limit = '50', offset = '0' } = c.req.query()

  const prospects = await prisma.prospect.findMany({
    where: {
      tenantId,
      deletedAt: null,
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
      ...(stage ? { stage: stage as any } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit),
    skip: parseInt(offset),
  })

  return c.json(prospects)
})

prospectRoutes.post('/', zValidator('json', prospectSchema), async (c) => {
  const { tenantId } = c.get('user')
  const data = c.req.valid('json')
  const prospect = await prisma.prospect.create({
    data: { tenantId, ...data },
  })
  return c.json(prospect, 201)
})

prospectRoutes.get('/:id', async (c) => {
  const { tenantId } = c.get('user')
  const id = c.req.param('id')
  const prospect = await prisma.prospect.findFirst({
    where: { id, tenantId, deletedAt: null },
    include: {
      followLogs: { where: { deletedAt: null }, orderBy: { logDate: 'desc' } },
      eventAttendees: { include: { event: true } },
    },
  })
  if (!prospect) return c.json({ error: 'Not found' }, 404)
  return c.json(prospect)
})

prospectRoutes.patch('/:id', zValidator('json', prospectSchema.partial()), async (c) => {
  const { tenantId } = c.get('user')
  const id = c.req.param('id')
  const data = c.req.valid('json')
  await prisma.prospect.updateMany({
    where: { id, tenantId, deletedAt: null },
    data,
  })
  return c.json(await prisma.prospect.findUnique({ where: { id } }))
})

// Convert prospect to customer
prospectRoutes.post('/:id/convert', async (c) => {
  const { tenantId } = c.get('user')
  const id = c.req.param('id')

  const prospect = await prisma.prospect.findFirst({
    where: { id, tenantId, deletedAt: null },
  })
  if (!prospect) return c.json({ error: 'Prospect not found' }, 404)

  const result = await prisma.$transaction(async (db) => {
    // Create customer from prospect data
    const customer = await db.customer.create({
      data: {
        tenantId,
        name: prospect.name,
        phone: prospect.phone,
        email: prospect.email,
        acquisitionSource: prospect.acquisitionSource,
        notes: prospect.notes,
        sourceId: prospect.id,
      },
    })
    // Mark prospect as CLOSED_WON and soft-delete
    await db.prospect.update({
      where: { id },
      data: { stage: 'CLOSED_WON', deletedAt: new Date() },
    })
    return customer
  })

  return c.json(result, 201)
})

prospectRoutes.delete('/:id', async (c) => {
  const { tenantId } = c.get('user')
  const id = c.req.param('id')
  await prisma.prospect.updateMany({
    where: { id, tenantId },
    data: { deletedAt: new Date() },
  })
  return c.json({ ok: true })
})
