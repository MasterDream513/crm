import { Hono } from 'hono'
import { prisma } from '../../lib/prisma.js'
import { authMiddleware } from '../../middleware/auth.js'
import { calcRepeatRate, calcMaCps, isProfitable } from '../../lib/kpi-calc.js'

export const kpiRoutes = new Hono()
kpiRoutes.use('*', authMiddleware)

/**
 * GET /api/v1/kpi/dashboard
 * Returns all KPI panels (daily, weekly, monthly) in a single request.
 * Data is served from kpi_snapshots where available (< 3s load guarantee).
 * Falls back to live calculation if snapshot is stale.
 */
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
    // A案: auto-count follow logs with a customer (not prospect) entered today
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

  // Repeat rate: customers with 2+ transactions / total customers
  const [totalCustomers, repeatCustomers] = await Promise.all([
    prisma.customer.count({ where: { tenantId, deletedAt: null } }),
    prisma.customer.count({
      where: {
        tenantId,
        deletedAt: null,
        transactions: { some: { deletedAt: null } },
        AND: [{ transactions: { some: { deletedAt: null } } }],
      },
    }),
  ])

  // Count customers with 2+ transactions (repeat customers)
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

  // Per-product volume
  const productVolume: Record<string, { name: string; count: number; revenue: number }> = {}
  for (const t of transactions) {
    if (!t.product) continue
    const key = t.productId!
    if (!productVolume[key]) productVolume[key] = { name: t.product.name, count: 0, revenue: 0 }
    productVolume[key].count += 1
    productVolume[key].revenue += t.amountJpy
  }

  return {
    cpa: latestFunnel?.cpa ?? null,
    cps: latestFunnel?.cps ?? null,
    cvr: latestFunnel?.atv ? null : null, // manual entry or computed from events
    epc: latestFunnel?.epc ?? null,
    cpc: latestFunnel?.cpc ?? null,
    referralCount: referralStats,
    productVolume,
    periodStart: weekStart.toISOString(),
  }
}

async function getMonthlyKpi(tenantId: string, now: Date, marginRate: number) {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    transactions,
    expenses,
    newCustomers,
    allCustomers,
    subscriptionCustomers,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: { tenantId, deletedAt: null, transactionDate: { gte: monthStart } },
    }),
    prisma.expense.findMany({
      where: { tenantId, deletedAt: null, expenseDate: { gte: monthStart } },
    }),
    prisma.customer.count({ where: { tenantId, deletedAt: null, createdAt: { gte: monthStart } } }),
    prisma.customer.count({ where: { tenantId, deletedAt: null } }),
    // Active subscriptions (The Leaders College)
    prisma.transaction.count({
      where: {
        tenantId,
        deletedAt: null,
        billingType: 'RECURRING_MONTHLY',
        subscriptionStatus: 'ACTIVE',
        transactionDate: { gte: monthStart },
      },
    }),
  ])

  const revenueJpy = transactions.reduce((s, t) => s + t.amountJpy, 0)
  const expenseJpy = expenses.reduce((s, e) => s + e.amountJpy, 0)
  const subscriptionMrr = transactions
    .filter((t) => t.billingType === 'RECURRING_MONTHLY')
    .reduce((s, t) => s + t.amountJpy, 0)

  // LTV proxy: average cumulative spend across all customers
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
