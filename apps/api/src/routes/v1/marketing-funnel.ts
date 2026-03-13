import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { authMiddleware } from '../../middleware/auth.js'
import { calcMaCps } from '../../lib/kpi-calc.js'

export const marketingFunnelRoutes = new Hono()
marketingFunnelRoutes.use('*', authMiddleware)

const funnelSchema = z.object({
  recordDate: z.string(),
  campaignLabel: z.string().optional(),
  atv: z.number().optional(),
  epc: z.number().optional(),
  cpc: z.number().optional(),
  cpa: z.number().optional(),
  cps: z.number().optional(),
  totalClicks: z.number().int().optional(),
  totalRevenue: z.number().int().optional(),
  totalAdSpend: z.number().int().optional(),
  notes: z.string().optional(),
})

marketingFunnelRoutes.post('/', zValidator('json', funnelSchema), async (c) => {
  const { tenantId } = c.get('user')
  const data = c.req.valid('json')

  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } })
  const marginRate = settings?.maCpsMarginRate ?? 0.60

  // Auto-compute derived fields
  const epc = data.epc ?? (data.totalRevenue && data.totalClicks
    ? data.totalRevenue / data.totalClicks : undefined)
  const cpc = data.cpc ?? (data.totalAdSpend && data.totalClicks
    ? data.totalAdSpend / data.totalClicks : undefined)
  const cps = data.cps ?? (data.totalAdSpend && data.atv
    ? data.totalAdSpend / (data.totalRevenue! / data.atv) : undefined)

  // MA-CPS = ATV × margin rate (using ATV as LTV proxy for funnel context)
  const maCps = data.atv ? calcMaCps(data.atv, marginRate) : undefined

  const record = await prisma.marketingFunnel.create({
    data: {
      tenantId,
      ...data,
      epc,
      cpc,
      cps,
      maCps,
      recordDate: new Date(data.recordDate),
    },
  })
  return c.json(record, 201)
})

marketingFunnelRoutes.get('/', async (c) => {
  const { tenantId } = c.get('user')
  const records = await prisma.marketingFunnel.findMany({
    where: { tenantId },
    orderBy: { recordDate: 'desc' },
    take: 30,
  })
  return c.json(records)
})
