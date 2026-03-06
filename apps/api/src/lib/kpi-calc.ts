/**
 * Core KPI calculation functions.
 * All formulas are unit-tested — do not change without updating tests.
 */

/** Repeat rate = customers with 2+ purchases / total customers */
export function calcRepeatRate(totalCustomers: number, repeatCustomers: number): number {
  if (totalCustomers === 0) return 0
  return repeatCustomers / totalCustomers
}

/**
 * CVR (Sales) = closed deals / seminar attendees
 * Phase 1 definition: seminar attendees → paying customers
 */
export function calcCvr(closedDeals: number, seminarAttendees: number): number {
  if (seminarAttendees === 0) return 0
  return closedDeals / seminarAttendees
}

/**
 * CPA = total ad spend / number of new customers
 */
export function calcCpa(totalAdSpend: number, newCustomers: number): number {
  if (newCustomers === 0) return 0
  return totalAdSpend / newCustomers
}

/**
 * CPS = total ad spend / number of sales
 */
export function calcCps(totalAdSpend: number, numberOfSales: number): number {
  if (numberOfSales === 0) return 0
  return totalAdSpend / numberOfSales
}

/**
 * EPC = total revenue / total clicks
 */
export function calcEpc(totalRevenue: number, totalClicks: number): number {
  if (totalClicks === 0) return 0
  return totalRevenue / totalClicks
}

/**
 * LTV proxy (Phase 1) = cumulative spend per customer
 * Time-horizon LTV (6mo/1yr/2yr/3yr) activates once data matures.
 */
export function calcLtvProxy(cumulativeSpend: number): number {
  return cumulativeSpend
}

/**
 * MA-CPS = LTV × target margin rate (confirmed: 60%)
 * "いくらまで顧客獲得にお金をかけられるか"
 */
export function calcMaCps(ltv: number, marginRate = 0.60): number {
  return ltv * marginRate
}

/**
 * P&L status — true = profit, false = loss
 */
export function isProfitable(revenueJpy: number, expenseJpy: number): boolean {
  return revenueJpy > expenseJpy
}
