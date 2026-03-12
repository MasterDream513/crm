import { Hono } from 'hono'
import { prisma } from '../../lib/prisma.js'
import { authMiddleware } from '../../middleware/auth.js'
import { calcRepeatRate, calcMaCps, isProfitable } from '../../lib/kpi-calc.js'

export const kpiRoutes = new Hono()
kpiRoutes.use('*', authMiddleware)

kpiRoutes.get('/dashboard', async (c) => {
  const { tenantId } = c.get('user')
  const now = new Date()

  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } })
  const churnDays = settings?.churnThresholdDays ?? 90
  const marginRate = settings?.maCpsMarginRate ?? 0.60

  const [daily, weekly, monthly] = await Promise.all([
    getDailyKpi(tenantId, now, churnDays),
    getWeeklyKpi(tenantId, now),
    getMonthlyKpi(tenantId, now, marginRate),
  ])

  return c.json({ daily, weekly, monthly, generatedAt: now.toISOString() })
})

async function getDailyKpi(tenantId: string, now: Date, churnDays: number) {
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const churnDate = new Date(now)
  churnDate.setDate(now.getDate() - churnDays)

  const [transactions, expenses, newCustomers, followLogCount, churnRisk] = await Promise.all([
    prisma.transaction.findMany({
      where: { tenantId, deletedAt: null, transactionDate: { gte: todayStart } },
    }),
    prisma.expense.findMany({
      where: { tenantId, deletedAt: null, expenseDate: { gte: todayStart } },
    }),
    prisma.customer.count({
      where: { tenantId, deletedAt: null, createdAt: { gte: todayStart } },
    }),
    prisma.followLog.count({
      where: {
        tenantId,
        deletedAt: null,
        logDate: { gte: todayStart },
        customerId: { not: null },
      },
    }),
    prisma.customer.count({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { lastPurchaseDate: { lt: churnDate } },
          { lastPurchaseDate: null },
        ],
      },
    }),
  ])

  const revenueJpy = transactions.reduce((s, t) => s + t.amountJpy, 0)
  const expenseJpy = expenses.reduce((s, e) => s + e.amountJpy, 0)
  const profitJpy = revenueJpy - expenseJpy

  const totalCustomers = await prisma.customer.count({ where: { tenantId, deletedAt: null } })

  const repeatResult = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint as count FROM (
      SELECT customer_id FROM transactions
      WHERE tenant_id = ${tenantId} AND deleted_at IS NULL
      GROUP BY customer_id HAVING COUNT(*) >= 2
    ) sub
  `
  const repeatCount = Number(repeatResult[0]?.count ?? 0)
  const repeatRate = calcRepeatRate(totalCustomers, repeatCount)

  return {
    revenueJpy,
    expenseJpy,
    profitJpy,
    isProfit: isProfitable(revenueJpy, expenseJpy),
    newCustomers,
    existingCustomersHandled: followLogCount,
    repeatRate,
    churnRiskCount: churnRisk,
  }
}

async function getWeeklyKpi(tenantId: string, now: Date) {
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 6)
  weekStart.setHours(0, 0, 0, 0)

  const [transactions, referralStats, latestFunnel] = await Promise.all([
    prisma.transaction.findMany({
      where: { tenantId, deletedAt: null, transactionDate: { gte: weekStart } },
      include: { product: { select: { id: true, name: true } } },
    }),
    prisma.referral.count({ where: { tenantId, referralDate: { gte: weekStart } } }),
    prisma.marketingFunnel.findFirst({
      where: { tenantId, recordDate: { gte: weekStart } },
      orderBy: { recordDate: 'desc' },
    }),
  ])

  // Per-product volume — use field names matching UI types
  const productVolume: Record<string, { productName: string; count: number; revenueJpy: number }> = {}
  for (const t of transactions) {
    if (!t.product) continue
    const key = t.productId!
    if (!productVolume[key]) productVolume[key] = { productName: t.product.name, count: 0, revenueJpy: 0 }
    productVolume[key].count += 1
    productVolume[key].revenueJpy += t.amountJpy
  }

  // Compute ATV (Average Transaction Value) from weekly transactions
  const totalRevenue = transactions.reduce((s, t) => s + t.amountJpy, 0)
  const atv = transactions.length > 0 ? Math.round(totalRevenue / transactions.length) : (latestFunnel?.atv ?? null)

  return {
    cpa: latestFunnel?.cpa ?? null,
    cps: latestFunnel?.cps ?? null,
    epc: latestFunnel?.epc ?? null,
    cpc: latestFunnel?.cpc ?? null,
    atv,
    referralCount: referralStats,
    productVolume,
    periodStart: weekStart.toISOString(),
  }
}

async function getMonthlyKpi(tenantId: string, now: Date, marginRate: number) {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [transactions, expenses, newCustomers, allCustomers] = await Promise.all([
    prisma.transaction.findMany({
      where: { tenantId, deletedAt: null, transactionDate: { gte: monthStart } },
    }),
    prisma.expense.findMany({
      where: { tenantId, deletedAt: null, expenseDate: { gte: monthStart } },
    }),
    prisma.customer.count({ where: { tenantId, deletedAt: null, createdAt: { gte: monthStart } } }),
    prisma.customer.count({ where: { tenantId, deletedAt: null } }),
  ])

  const revenueJpy = transactions.reduce((s, t) => s + t.amountJpy, 0)
  const expenseJpy = expenses.reduce((s, e) => s + e.amountJpy, 0)
  const subscriptionMrr = transactions
    .filter((t) => t.billingType === 'RECURRING_MONTHLY')
    .reduce((s, t) => s + t.amountJpy, 0)

  const ltvAgg = await prisma.customer.aggregate({
    where: { tenantId, deletedAt: null },
    _avg: { cumulativeSpend: true },
  })
  const ltvAvg = ltvAgg._avg.cumulativeSpend ?? 0
  const maCps = calcMaCps(ltvAvg, marginRate)

  const repeatCustomerResult = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint as count FROM (
      SELECT customer_id FROM transactions
      WHERE tenant_id = ${tenantId} AND deleted_at IS NULL
      GROUP BY customer_id HAVING COUNT(*) >= 2
    ) sub
  `
  const repeatCount = Number(repeatCustomerResult[0]?.count ?? 0)

  return {
    revenueJpy,
    expenseJpy,
    profitJpy: revenueJpy - expenseJpy,
    isProfit: revenueJpy >= expenseJpy,
    ltvAvg,
    maCps,
    subscriptionMrr,
    newCustomers,
    repeatCustomers: repeatCount,
    totalCustomers: allCustomers,
    newVsRepeat: {
      new: newCustomers,
      repeat: repeatCount,
    },
    periodStart: monthStart.toISOString(),
  }
}
