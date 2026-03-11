'use client'
import { useEffect, useState } from 'react'
import {
  TrendingUp, TrendingDown, Users, UserCheck,
  AlertTriangle, RefreshCw, GitBranch, BarChart3
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import { api } from '@/lib/api'
import { formatYen, formatPct } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

function KpiTooltip({ meta }: { meta: { desc: string; hint: string } | undefined }) {
  if (!meta) return null
  return (
    <div className="group relative inline-block ml-1">
      <span className="text-gray-400 cursor-help text-xs border border-gray-300 rounded-full w-4 h-4 inline-flex items-center justify-center">?</span>
      <div className="hidden group-hover:block absolute left-0 top-5 z-10 bg-gray-900 text-white text-xs rounded-lg p-3 w-64 shadow-xl">
        <p className="font-medium mb-1">{meta.desc}</p>
        <p className="text-gray-300">{meta.hint}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { t, locale } = useI18n()
  const [kpi, setKpi] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const KPI_META: Record<string, { desc: string; hint: string }> = {
    cpa: t.kpiTooltips.cpa,
    cps: t.kpiTooltips.cps,
    cvr: t.kpiTooltips.cvr,
    epc: t.kpiTooltips.epc,
    cpc: t.kpiTooltips.cpc,
    ltv: t.kpiTooltips.ltv,
    maCps: t.kpiTooltips.maCps,
  }

  async function load() {
    setLoading(true)
    try {
      const data = await api.kpi.dashboard()
      setKpi(data)
      setLastUpdated(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading && !kpi) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <RefreshCw className="animate-spin mr-2" size={18} /> {t.common.loading}
      </div>
    )
  }

  const d = kpi?.daily ?? {}
  const w = kpi?.weekly ?? {}
  const m = kpi?.monthly ?? {}

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t.dashboard.todayStatus}</h2>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-0.5">
              {t.dashboard.lastUpdated} {lastUpdated.toLocaleTimeString(locale === 'ja' ? 'ja-JP' : 'en-US')}
            </p>
          )}
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {t.common.refresh}
        </button>
      </div>

      {/* ── Daily KPI (5 core metrics) ─────────────────────── */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {t.dashboard.dailyHeader}
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Revenue / Profit */}
          <div className={`kpi-card col-span-2 lg:col-span-1 border-l-4 ${d.isProfit ? 'border-green-500' : 'border-red-500'}`}>
            <p className="text-xs text-gray-500 mb-1">{t.dashboard.todayRevenue}</p>
            <p className="text-2xl font-bold">{formatYen(d.revenueJpy ?? 0)}</p>
            <p className={`text-sm font-semibold mt-0.5 ${d.isProfit ? 'profit-text' : 'loss-text'}`}>
              {d.isProfit ? t.dashboard.profitLabel : t.dashboard.lossLabel} {formatYen(Math.abs(d.profitJpy ?? 0))}
            </p>
            <p className="text-xs text-gray-400 mt-1">{t.dashboard.expense} {formatYen(d.expenseJpy ?? 0)}</p>
          </div>

          {/* 2. New customers */}
          <div className="kpi-card">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Users size={13} /> {t.dashboard.newCustomers}
            </div>
            <p className="text-3xl font-bold">{d.newCustomers ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">{t.common.unit_people}</p>
          </div>

          {/* 3. Existing handled */}
          <div className="kpi-card">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <UserCheck size={13} /> {t.dashboard.existingHandled}
            </div>
            <p className="text-3xl font-bold">{d.existingCustomersHandled ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">{t.dashboard.fromFollowLog}</p>
          </div>

          {/* 4. Repeat rate */}
          <div className="kpi-card">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <RefreshCw size={13} /> {t.dashboard.repeatRate}
            </div>
            <p className="text-3xl font-bold">{formatPct(d.repeatRate ?? 0)}</p>
            <p className="text-xs text-gray-400 mt-1">{t.dashboard.repeatRateDesc}</p>
          </div>

          {/* 5. Churn risk */}
          <div className={`kpi-card border-l-4 ${(d.churnRiskCount ?? 0) > 0 ? 'border-amber-400' : 'border-gray-200'}`}>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <AlertTriangle size={13} /> {t.dashboard.churnRisk}
            </div>
            <p className={`text-3xl font-bold ${(d.churnRiskCount ?? 0) > 0 ? 'text-amber-600' : ''}`}>
              {d.churnRiskCount ?? 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">{t.dashboard.churnRiskDesc}</p>
          </div>
        </div>
      </section>

      {/* ── Weekly KPI ─────────────────────────────────────── */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {t.dashboard.weeklyHeader}
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { key: 'cpa',  label: t.dashboard.cpaLabel, value: w.cpa  ? formatYen(w.cpa)  : t.dashboard.notEntered, unit: '' },
            { key: 'cps',  label: t.dashboard.cpsLabel, value: w.cps ? formatYen(w.cps) : t.dashboard.notEntered, unit: '' },
            { key: 'epc',  label: t.dashboard.epcLabel, value: w.epc ? formatYen(w.epc) : t.dashboard.notEntered, unit: '' },
            { key: 'cpc',  label: t.dashboard.cpcLabel, value: w.cpc ? formatYen(w.cpc) : t.dashboard.notEntered, unit: '' },
          ].map(({ key, label, value }) => (
            <div key={key} className="kpi-card">
              <div className="flex items-center text-xs text-gray-500 mb-1">
                {label} <KpiTooltip meta={KPI_META[key]} />
              </div>
              <p className="text-xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        {/* Per-product volume */}
        {w.productVolume && Object.keys(w.productVolume).length > 0 && (
          <div className="mt-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <BarChart3 size={15} /> {t.dashboard.productVolumeWeek}
            </h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={Object.values(w.productVolume).map((v: any) => ({
                  name: v.name.length > 12 ? v.name.slice(0, 12) + '…' : v.name,
                  count: v.count,
                  revenue: v.revenue,
                }))}
                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v}${t.common.unit_items}`]} />
                <Bar dataKey="count" fill="#475569" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          <div className="kpi-card">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <GitBranch size={13} /> {t.dashboard.referralsThisWeek}
            </div>
            <p className="text-3xl font-bold">{w.referralCount ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">{t.common.unit_items}</p>
          </div>
        </div>
      </section>

      {/* ── Monthly KPI ────────────────────────────────────── */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {t.dashboard.monthlyHeader}
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* LTV */}
          <div className="kpi-card">
            <div className="flex items-center text-xs text-gray-500 mb-1">
              {t.dashboard.ltvLabel}<KpiTooltip meta={KPI_META['ltv']} />
            </div>
            <p className="text-xl font-bold">
              {m.ltvAvg ? formatYen(Math.round(m.ltvAvg)) : t.dashboard.dataAccumulating}
            </p>
            <p className="text-xs text-gray-400 mt-1">{t.dashboard.ltvDesc}</p>
          </div>

          {/* MA-CPS */}
          <div className="kpi-card">
            <div className="flex items-center text-xs text-gray-500 mb-1">
              {t.dashboard.maCpsLabel}<KpiTooltip meta={KPI_META['maCps']} />
            </div>
            <p className="text-xl font-bold">
              {m.maCps ? formatYen(Math.round(m.maCps)) : t.dashboard.dataAccumulating}
            </p>
            <p className="text-xs text-gray-400 mt-1">{t.dashboard.maCpsFormula}</p>
          </div>

          {/* Expense vs profit */}
          <div className="kpi-card">
            <p className="text-xs text-gray-500 mb-1">{t.dashboard.balanceThisMonth}</p>
            <p className="text-xl font-bold">{formatYen(m.revenueJpy ?? 0)}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-green-600">{t.dashboard.revenue}</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{
                    width: m.revenueJpy
                      ? `${Math.min(100, (m.revenueJpy / (m.revenueJpy + m.expenseJpy)) * 100)}%`
                      : '0%',
                  }}
                />
              </div>
              <span className="text-xs text-red-500">{t.dashboard.expense} {formatYen(m.expenseJpy ?? 0)}</span>
            </div>
          </div>

          {/* Subscription MRR */}
          <div className="kpi-card">
            <p className="text-xs text-gray-500 mb-1">{t.dashboard.subscriptionMrr}</p>
            <p className="text-xl font-bold">{formatYen(m.subscriptionMrr ?? 0)}</p>
            <p className="text-xs text-gray-400 mt-1">{t.dashboard.recurringRevenue}</p>
          </div>
        </div>

        {/* New vs Repeat */}
        <div className="mt-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">{t.dashboard.newVsRepeat}</h4>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{t.dashboard.newLabel} {m.newCustomers ?? 0}{t.common.unit_people}</span>
                <span>{t.dashboard.repeatLabel} {m.repeatCustomers ?? 0}{t.common.unit_people}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                {(m.totalCustomers ?? 0) > 0 && (
                  <>
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${((m.newCustomers ?? 0) / m.totalCustomers) * 100}%` }}
                    />
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${((m.repeatCustomers ?? 0) / m.totalCustomers) * 100}%` }}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
