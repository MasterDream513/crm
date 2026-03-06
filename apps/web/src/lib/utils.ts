import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatYen(amount: number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount)
}

export function formatPct(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`
}

export const RANK_LABELS: Record<string, string> = {
  RANK_1: '無料会員',
  RANK_2: '一般客',
  RANK_3: '優良客',
  RANK_4: 'VIP予備',
  RANK_5: 'VIP',
  RANK_6: 'スーパーVIP',
}

export const RANK_COLORS: Record<string, string> = {
  RANK_1: 'bg-slate-100 text-slate-600',
  RANK_2: 'bg-blue-100 text-blue-700',
  RANK_3: 'bg-emerald-100 text-emerald-700',
  RANK_4: 'bg-amber-100 text-amber-700',
  RANK_5: 'bg-orange-100 text-orange-700',
  RANK_6: 'bg-purple-100 text-purple-700',
}
