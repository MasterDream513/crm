import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { authMiddleware } from '../../middleware/auth.js'
import { calcRank } from '../../lib/rank.js'

export const transactionRoutes = new Hono()
transactionRoutes.use('*', authMiddleware)

const transactionSchema = z.object({
  customerId: z.string().uuid(),
  productId: z.string().uuid().nullish().or(z.literal('')).transform(v => v || undefined),
  amountJpy: z.number().int().min(0),
  billingType: z.enum(['ONE_TIME', 'RECURRING_MONTHLY', 'RECURRING_ANNUAL']).default('ONE_TIME'),
  subscriptionStatus: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED']).optional(),
  transactionDate: z.string().datetime(),
  note: z.string().optional(),
})

transactionRoutes.post('/', zValidator('json', transactionSchema), async (c) => {
  const { tenantId } = c.get('user')
  const data = c.req.valid('json')

  const tx = await prisma.$transaction(async (db) => {
    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        tenantId,
        customerId: data.customerId,
        productId: data.productId,
        amountJpy: data.amountJpy,
        billingType: data.billingType,
        subscriptionStatus: data.subscriptionStatus,
        transactionDate: new Date(data.transactionDate),
        note: data.note,
      },
    })

    // Update customer cumulative spend, last purchase date, and rank
    const customer = await db.customer.findUnique({ where: { id: data.customerId } })
    if (!customer) throw new Error('Customer not found')

    const newSpend = customer.cumulativeSpend + data.amountJpy
    const newRank = calcRank(newSpend)

    await db.customer.update({
      where: { id: data.customerId },
      data: {
        cumulativeSpend: newSpend,
        lastPurchaseDate: new Date(data.transactionDate),
        rank: newRank,
      },
    })

    return transaction
  })

  return c.json(tx, 201)
})

transactionRoutes.get('/', async (c) => {
  const { tenantId } = c.get('user')
  const { customerId, from, to, limit = '50', offset = '0' } = c.req.query()

  const transactions = await prisma.transaction.findMany({
    where: {
      tenantId,
      deletedAt: null,
      ...(customerId ? { customerId } : {}),
      ...(from || to
        ? {
            transactionDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: { product: true, customer: { select: { id: true, name: true, rank: true } } },
    orderBy: { transactionDate: 'desc' },
    take: parseInt(limit),
    skip: parseInt(offset),
  })
  return c.json(transactions)
})

// Daily / weekly / monthly sales summary
transactionRoutes.get('/summary', async (c) => {
  const { tenantId } = c.get('user')
  const { period = 'daily' } = c.req.query()

  const now = new Date()
  let from: Date

  if (period === 'weekly') {
    from = new Date(now)
    from.setDate(now.getDate() - 6)
    from.setHours(0, 0, 0, 0)
  } else if (period === 'monthly') {
    from = new Date(now.getFullYear(), now.getMonth(), 1)
  } else {
    // daily
    from = new Date(now)
    from.setHours(0, 0, 0, 0)
  }

  const [transactions, expenses] = await Promise.all([
    prisma.transaction.findMany({
      where: { tenantId, deletedAt: null, transactionDate: { gte: from } },
      include: { product: { select: { id: true, name: true, category: true } } },
    }),
    prisma.expense.findMany({
      where: { tenantId, deletedAt: null, expenseDate: { gte: from } },
    }),
  ])

  const revenueJpy = transactions.reduce((s, t) => s + t.amountJpy, 0)
  const expenseJpy = expenses.reduce((s, e) => s + e.amountJpy, 0)
  const profitJpy = revenueJpy - expenseJpy

  // Per-product volume (weekly / monthly)
  const productVolume: Record<string, { name: string; count: number; revenue: number }> = {}
  for (const t of transactions) {
    if (!t.product) continue
    const key = t.productId!
    if (!productVolume[key]) productVolume[key] = { name: t.product.name, count: 0, revenue: 0 }
    productVolume[key].count += 1
    productVolume[key].revenue += t.amountJpy
  }

  // Previous period for comparison
  const prevFrom = new Date(from)
  const diffMs = now.getTime() - from.getTime()
  prevFrom.setTime(prevFrom.getTime() - diffMs)

  const prevTx = await prisma.transaction.findMany({
    where: { tenantId, deletedAt: null, transactionDate: { gte: prevFrom, lt: from } },
  })
  const prevRevenue = prevTx.reduce((s, t) => s + t.amountJpy, 0)

  return c.json({
    period,
    from: from.toISOString(),
    to: now.toISOString(),
    revenueJpy,
    expenseJpy,
    profitJpy,
    isProfit: profitJpy >= 0,
    transactionCount: transactions.length,
    productVolume,
    vsLastPeriod: prevRevenue > 0 ? ((revenueJpy - prevRevenue) / prevRevenue) * 100 : null,
  })
})
