import { describe, it, expect } from 'vitest'
import { calcRank } from '../rank.js'

// CustomerRank enum values (mirrors Prisma enum)
const RANK = {
  RANK_1: 'RANK_1',
  RANK_2: 'RANK_2',
  RANK_3: 'RANK_3',
  RANK_4: 'RANK_4',
  RANK_5: 'RANK_5',
  RANK_6: 'RANK_6',
} as const

describe('calcRank — 6-tier customer rank by cumulative spend', () => {
  it('RANK_1: ¥0 (no purchases)', () => {
    expect(calcRank(0)).toBe(RANK.RANK_1)
  })

  it('RANK_2: ¥1 to ¥30,000', () => {
    expect(calcRank(1)).toBe(RANK.RANK_2)
    expect(calcRank(15_000)).toBe(RANK.RANK_2)
    expect(calcRank(30_000)).toBe(RANK.RANK_2)
  })

  it('RANK_3: ¥30,001 to ¥100,000', () => {
    expect(calcRank(30_001)).toBe(RANK.RANK_3)
    expect(calcRank(99_800)).toBe(RANK.RANK_3)  // before price correction
    expect(calcRank(100_000)).toBe(RANK.RANK_3)
  })

  it('RANK_4: ¥100,001 to ¥500,000', () => {
    expect(calcRank(100_001)).toBe(RANK.RANK_4)
    expect(calcRank(298_000)).toBe(RANK.RANK_4)
    expect(calcRank(500_000)).toBe(RANK.RANK_4)
  })

  it('RANK_5: ¥500,001 to ¥1,000,000', () => {
    expect(calcRank(500_001)).toBe(RANK.RANK_5)
    expect(calcRank(750_000)).toBe(RANK.RANK_5)
    expect(calcRank(1_000_000)).toBe(RANK.RANK_5)
  })

  it('RANK_6: above ¥1,000,000', () => {
    expect(calcRank(1_000_001)).toBe(RANK.RANK_6)
    expect(calcRank(5_000_000)).toBe(RANK.RANK_6)
  })

  it('handles negative spend (edge case) as RANK_1', () => {
    expect(calcRank(-1)).toBe(RANK.RANK_1)
  })

  // Real product price boundary checks
  it('セミナー購入 ¥109,780 puts customer at RANK_4', () => {
    expect(calcRank(109_780)).toBe(RANK.RANK_4)
  })

  it('Leaders College subscription ¥24,200 alone stays RANK_2', () => {
    expect(calcRank(24_200)).toBe(RANK.RANK_2)
  })

  it('Two high-ticket products crosses RANK_5 threshold', () => {
    // 個別コンサルティング ¥298,000 × 2 = ¥596,000
    expect(calcRank(596_000)).toBe(RANK.RANK_5)
  })
})
