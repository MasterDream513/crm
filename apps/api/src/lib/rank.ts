import { CustomerRank } from '@prisma/client'

/**
 * Calculates the 6-tier customer rank from cumulative spend (JPY).
 * Thresholds confirmed by client 2026-02-21.
 */
export function calcRank(cumulativeSpendJpy: number): CustomerRank {
  if (cumulativeSpendJpy <= 0)        return CustomerRank.RANK_1
  if (cumulativeSpendJpy <= 30_000)   return CustomerRank.RANK_2
  if (cumulativeSpendJpy <= 100_000)  return CustomerRank.RANK_3
  if (cumulativeSpendJpy <= 500_000)  return CustomerRank.RANK_4
  if (cumulativeSpendJpy <= 1_000_000) return CustomerRank.RANK_5
  return CustomerRank.RANK_6
}

export const RANK_LABELS: Record<CustomerRank, string> = {
  RANK_1: '無料会員',
  RANK_2: '一般客（〜¥30,000）',
  RANK_3: '優良客（〜¥100,000）',
  RANK_4: 'VIP予備（〜¥500,000）',
  RANK_5: 'VIP（〜¥1,000,000）',
  RANK_6: 'スーパーVIP（¥1,000,000〜）',
}
