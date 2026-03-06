import { describe, it, expect } from 'vitest'
import {
  calcRepeatRate,
  calcCvr,
  calcCpa,
  calcCps,
  calcEpc,
  calcLtvProxy,
  calcMaCps,
  isProfitable,
} from '../kpi-calc.js'

describe('calcRepeatRate', () => {
  it('returns 0 when no customers', () => {
    expect(calcRepeatRate(0, 0)).toBe(0)
  })
  it('calculates repeat rate correctly', () => {
    expect(calcRepeatRate(10, 4)).toBe(0.4)
  })
  it('returns 1 when all customers are repeat', () => {
    expect(calcRepeatRate(5, 5)).toBe(1)
  })
})

describe('calcCvr', () => {
  it('returns 0 when no seminar attendees', () => {
    expect(calcCvr(5, 0)).toBe(0)
  })
  it('calculates CVR correctly', () => {
    expect(calcCvr(3, 10)).toBe(0.3)
  })
  it('returns 1 when all attendees close', () => {
    expect(calcCvr(10, 10)).toBe(1)
  })
})

describe('calcCpa', () => {
  it('returns 0 when no new customers', () => {
    expect(calcCpa(100_000, 0)).toBe(0)
  })
  it('calculates CPA correctly', () => {
    expect(calcCpa(300_000, 20)).toBe(15_000)
  })
})

describe('calcCps', () => {
  it('returns 0 when no sales', () => {
    expect(calcCps(100_000, 0)).toBe(0)
  })
  it('calculates CPS correctly', () => {
    // ClickFunnels example: ad spend ¥800 per click × 100 clicks = ¥80,000 / 5 sales = ¥16,000
    expect(calcCps(80_000, 5)).toBe(16_000)
  })
})

describe('calcEpc', () => {
  it('returns 0 when no clicks', () => {
    expect(calcEpc(100_000, 0)).toBe(0)
  })
  it('calculates EPC correctly', () => {
    // Client example: ¥300 EPC from ¥300,000 revenue / 1000 clicks
    expect(calcEpc(300_000, 1000)).toBe(300)
  })
})

describe('calcLtvProxy', () => {
  it('returns cumulative spend as-is (Phase 1 proxy)', () => {
    expect(calcLtvProxy(109_780)).toBe(109_780)
    expect(calcLtvProxy(0)).toBe(0)
  })
})

describe('calcMaCps', () => {
  it('uses 60% margin rate by default (confirmed with client)', () => {
    // Client example: ATV ¥36,662 → MA-CPS ¥21,997.2
    expect(calcMaCps(36_662)).toBeCloseTo(21_997.2, 1)
  })
  it('respects custom margin rate', () => {
    expect(calcMaCps(100_000, 0.5)).toBe(50_000)
  })
  it('returns 0 for zero LTV', () => {
    expect(calcMaCps(0)).toBe(0)
  })
  it('calculates MA-CPS for highest-tier LTV scenario', () => {
    // RANK_6 customer: ¥1,000,000+ spend → MA-CPS = ¥600,000+
    expect(calcMaCps(1_000_000)).toBe(600_000)
  })
})

describe('isProfitable', () => {
  it('returns true when revenue exceeds expenses', () => {
    expect(isProfitable(500_000, 300_000)).toBe(true)
  })
  it('returns false when expenses exceed revenue', () => {
    expect(isProfitable(200_000, 400_000)).toBe(false)
  })
  it('returns false when break-even (no profit)', () => {
    expect(isProfitable(300_000, 300_000)).toBe(false)
  })
})
