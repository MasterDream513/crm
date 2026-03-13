import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { authMiddleware } from '../../middleware/auth.js'

export const referralRoutes = new Hono()
referralRoutes.use('*', authMiddleware)

const referralSchema = z.object({
  referrerCustomerId: z.string().uuid(),
  referredCustomerId: z.string().uuid(),
  referralDate: z.string(),
  note: z.string().optional(),
})

referralRoutes.post('/', zValidator('json', referralSchema), async (c) => {
  const { tenantId } = c.get('user')
  const data = c.req.valid('json')
  const referral = await prisma.referral.create({
    data: { tenantId, ...data, referralDate: new Date(data.referralDate) },
    include: {
      referrerCustomer: { select: { id: true, name: true } },
      referredCustomer: { select: { id: true, name: true } },
    },
  })
  return c.json(referral, 201)
})

referralRoutes.get('/stats', async (c) => {
  const { tenantId } = c.get('user')

  const [totalReferrals, totalCustomers, topReferrers] = await Promise.all([
    prisma.referral.count({ where: { tenantId } }),
    prisma.customer.count({ where: { tenantId, deletedAt: null } }),
    prisma.referral.groupBy({
      by: ['referrerCustomerId'],
      where: { tenantId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ])

  // Fetch names for top referrers
  const referrerIds = topReferrers.map((r) => r.referrerCustomerId)
  const referrers = await prisma.customer.findMany({
    where: { id: { in: referrerIds } },
    select: { id: true, name: true, rank: true, cumulativeSpend: true },
  })

  return c.json({
    totalReferrals,
    customersWhoReferred: topReferrers.length,
    referralRate: totalCustomers > 0 ? topReferrers.length / totalCustomers : 0,
    topReferrers: topReferrers.map((r) => ({
      count: r._count.id,
      customer: referrers.find((c) => c.id === r.referrerCustomerId),
    })),
  })
})
