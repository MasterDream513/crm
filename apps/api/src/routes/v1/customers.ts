import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { authMiddleware } from '../../middleware/auth.js'

export const customerRoutes = new Hono()
customerRoutes.use('*', authMiddleware)

const customerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email().optional(),
  acquisitionSource: z.string().optional(),
  firstContactDate: z.string().datetime().optional(),
  notes: z.string().optional(),
})

customerRoutes.get('/', async (c) => {
  try {
    const { tenantId } = c.get('user')
    const {
      q, rank, dormant, source,
      limit = '50', offset = '0',
    } = c.req.query()

    const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } })
    const churnDays = settings?.churnThresholdDays ?? 90
    const churnDate = new Date()
    churnDate.setDate(churnDate.getDate() - churnDays)

    const customers = await prisma.customer.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
        ...(rank ? { rank: rank as any } : {}),
        ...(dormant === 'true'
          ? {
              OR: [
                { lastPurchaseDate: { lt: churnDate } },
                { lastPurchaseDate: null },
              ],
            }
          : {}),
        ...(source ? { acquisitionSource: source } : {}),
      },
      include: {
        _count: { select: { transactions: true, followLogs: true, referralsGiven: true } },
      },
      orderBy: [{ rank: 'desc' }, { lastPurchaseDate: 'desc' }],
      take: parseInt(limit),
      skip: parseInt(offset),
    })

    // Annotate with dormant flag
    const now = new Date()
    return c.json(
      customers.map((cust) => ({
        ...cust,
        isDormant:
          !cust.lastPurchaseDate ||
          (now.getTime() - cust.lastPurchaseDate.getTime()) / 86_400_000 > churnDays,
        daysSinceLastPurchase: cust.lastPurchaseDate
          ? Math.floor((now.getTime() - cust.lastPurchaseDate.getTime()) / 86_400_000)
          : null,
      }))
    )
  } catch (err) {
    console.error('Customers list error:', err)
    return c.json({ error: 'Failed to load customers', detail: String(err) }, 500)
  }
})

customerRoutes.post('/', zValidator('json', customerSchema), async (c) => {
  const { tenantId } = c.get('user')
  const data = c.req.valid('json')
  const customer = await prisma.customer.create({
    data: {
      tenantId,
      ...data,
      firstContactDate: data.firstContactDate ? new Date(data.firstContactDate) : undefined,
    },
  })
  return c.json(customer, 201)
})

customerRoutes.get('/:id', async (c) => {
  const { tenantId } = c.get('user')
  const id = c.req.param('id')

  const customer = await prisma.customer.findFirst({
    where: { id, tenantId, deletedAt: null },
    include: {
      transactions: {
        where: { deletedAt: null },
        include: { product: true },
        orderBy: { transactionDate: 'desc' },
      },
      followLogs: {
        where: { deletedAt: null },
        orderBy: { logDate: 'desc' },
      },
      referralsGiven: {
        include: { referredCustomer: { select: { id: true, name: true } } },
      },
      eventAttendees: {
        include: { event: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!customer) return c.json({ error: 'Not found' }, 404)

  const now = new Date()
  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } })
  const churnDays = settings?.churnThresholdDays ?? 90

  return c.json({
    ...customer,
    isDormant:
      !customer.lastPurchaseDate ||
      (now.getTime() - customer.lastPurchaseDate.getTime()) / 86_400_000 > churnDays,
    daysSinceLastPurchase: customer.lastPurchaseDate
      ? Math.floor((now.getTime() - customer.lastPurchaseDate.getTime()) / 86_400_000)
      : null,
    ltvProxy: customer.cumulativeSpend,
    maCps: customer.cumulativeSpend * (settings?.maCpsMarginRate ?? 0.60),
  })
})

customerRoutes.patch('/:id', zValidator('json', customerSchema.partial()), async (c) => {
  const { tenantId } = c.get('user')
  const id = c.req.param('id')
  const data = c.req.valid('json')
  await prisma.customer.updateMany({
    where: { id, tenantId, deletedAt: null },
    data: {
      ...data,
      firstContactDate: data.firstContactDate ? new Date(data.firstContactDate) : undefined,
    },
  })
  return c.json(await prisma.customer.findUnique({ where: { id } }))
})

customerRoutes.delete('/:id', async (c) => {
  const { tenantId } = c.get('user')
  const id = c.req.param('id')
  await prisma.customer.updateMany({
    where: { id, tenantId },
    data: { deletedAt: new Date() },
  })
  return c.json({ ok: true })
})
