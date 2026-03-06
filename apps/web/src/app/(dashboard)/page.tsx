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

// ── KPI metadata: label + Japanese description + action hint ──────────────
const KPI_META: Record<string, { desc: string; hint: string }> = {
  cpa:  { desc: '1人のお客様を獲得するために使った広告費', hint: '上がったら広告クリエイティブを見直しましょう' },
  cps:  { desc: '1件の販売にかかった広告費合計', hint: 'ATVと比較して利益が出ているか確認しましょう' },
  cvr:  { desc: 'セミナー参加者のうち成約した割合', hint: '下がったらセールストークや提案内容を改善しましょう' },
  epc:  { desc: '1クリックあたりに生まれた収益', hint: 'CPCより高ければ広告は黒字。低ければ赤字です' },
  cpc:  { desc: '1クリックあたりの広告費', hint: 'EPCと比較して収益性を判断してください' },
  ltv:  { desc: '顧客1人が生涯にわたって支払う平均金額', hint: '上げるにはアップセルとリピート促進が有効です' },
  maCps:{ desc: 'LTVを元に計算した顧客獲得の上限コスト', hint: 'CPAがこの数字を超えたら広告は赤字です' },
}

function KpiTooltip({ metaKey }: { metaKey: string }) {
  const m = KPI_META[metaKey]
  if (!m) return null
  return (
    <div className="group relative inline-block ml-1">
      <span className="text-gray-400 cursor-help text-xs border border-gray-300 rounded-full w-4 h-4 inline-flex items-center justify-center">?</span>
      <div className="hidden group-hover:block absolute left-0 top-5 z-10 bg-gray-900 text-white text-xs rounded-lg p-3 w-64 shadow-xl">
        <p className="font-medium mb-1">{m.desc}</p>
        <p className="text-gray-300">👉 {m.hint}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [kpi, setKpi] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

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
        <RefreshCw className="animate-spin mr-2" size={18} /> 読み込み中...
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
          <h2 className="text-xl font-bold text-gray-900">今日の経営状況</h2>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-0.5">
              最終更新: {lastUpdated.toLocaleTimeString('ja-JP')}
            </p>
          )}
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 更新
        </button>
      </div>

      {/* ── Daily KPI (5 core metrics) ─────────────────────── */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          毎日確認 — Today
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Revenue / Profit */}
          <div className={`kpi-card col-span-2 lg:col-span-1 border-l-4 ${d.isProfit ? 'border-green-500' : 'border-red-500'}`}>
            <p className="text-xs text-gray-500 mb-1">本日 売上 / 損益</p>
            <p className="text-2xl font-bold">{formatYen(d.revenueJpy ?? 0)}</p>
            <p className={`text-sm font-semibold mt-0.5 ${d.isProfit ? 'profit-text' : 'loss-text'}`}>
              {d.isProfit ? '▲ 黒字' : '▼ 赤字'} {formatYen(Math.abs(d.profitJpy ?? 0))}
            </p>
            <p className="text-xs text-gray-400 mt-1">経費: {formatYen(d.expenseJpy ?? 0)}</p>
          </div>

          {/* 2. New customers */}
          <div className="kpi-card">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Users size={13} /> 本日 新規顧客
            </div>
            <p className="text-3xl font-bold">{d.newCustomers ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">名</p>
          </div>

          {/* 3. Existing handled */}
          <div className="kpi-card">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <UserCheck size={13} /> 本日 対応済み既存顧客
            </div>
            <p className="text-3xl font-bold">{d.existingCustomersHandled ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">名（フォローログより）</p>
          </div>

          {/* 4. Repeat rate */}
          <div className="kpi-card">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <RefreshCw size={13} /> リピート率
            </div>
            <p className="text-3xl font-bold">{formatPct(d.repeatRate ?? 0)}</p>
            <p className="text-xs text-gray-400 mt-1">2回以上購入した顧客の割合</p>
          </div>

          {/* 5. Churn risk */}
          <div className={`kpi-card border-l-4 ${(d.churnRiskCount ?? 0) > 0 ? 'border-amber-400' : 'border-gray-200'}`}>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <AlertTriangle size={13} /> 離脱リスク顧客
            </div>
            <p className={`text-3xl font-bold ${(d.churnRiskCount ?? 0) > 0 ? 'text-amber-600' : ''}`}>
              {d.churnRiskCount ?? 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">90日以上未購入</p>
          </div>
        </div>
      </section>

      {/* ── Weekly KPI ─────────────────────────────────────── */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          週次確認 — This Week
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { key: 'cpa',  label: 'CPA 顧客獲得単価', value: w.cpa  ? formatYen(w.cpa)  : '未入力', unit: '' },
            { key: 'cps',  label: 'CPS 販売あたりコスト', value: w.cps ? formatYen(w.cps) : '未入力', unit: '' },
            { key: 'epc',  label: 'EPC クリックあたり収益', value: w.epc ? formatYen(w.epc) : '未入力', unit: '' },
            { key: 'cpc',  label: 'CPC クリックあたり広告費', value: w.cpc ? formatYen(w.cpc) : '未入力', unit: '' },
          ].map(({ key, label, value }) => (
            <div key={key} className="kpi-card">
              <div className="flex items-center text-xs text-gray-500 mb-1">
                {label} <KpiTooltip metaKey={key} />
              </div>
              <p className="text-xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        {/* Per-product volume */}
        {w.productVolume && Object.keys(w.productVolume).length > 0 && (
          <div className="mt-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <BarChart3 size={15} /> 商品別販売数（今週）
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
                <Tooltip formatter={(v: number) => [`${v}件`]} />
                <Bar dataKey="count" fill="#475569" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          <div className="kpi-card">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <GitBranch size={13} /> 今週の紹介数
            </div>
            <p className="text-3xl font-bold">{w.referralCount ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">件</p>
          </div>
        </div>
      </section>

      {/* ── Monthly KPI ────────────────────────────────────── */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          月次確認 — This Month
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* LTV */}
          <div className="kpi-card">
            <div className="flex items-center text-xs text-gray-500 mb-1">
              LTV 顧客生涯価値（平均）<KpiTooltip metaKey="ltv" />
            </div>
            <p className="text-xl font-bold">
              {m.ltvAvg ? formatYen(Math.round(m.ltvAvg)) : '-- (データ蓄積中)'}
            </p>
            <p className="text-xs text-gray-400 mt-1">累計購入額の平均</p>
          </div>

          {/* MA-CPS */}
          <div className="kpi-card">
            <div className="flex items-center text-xs text-gray-500 mb-1">
              MA-CPS 最大許容獲得費用<KpiTooltip metaKey="maCps" />
            </div>
            <p className="text-xl font-bold">
              {m.maCps ? formatYen(Math.round(m.maCps)) : '-- (データ蓄積中)'}
            </p>
            <p className="text-xs text-gray-400 mt-1">LTV × 60%</p>
          </div>

          {/* Expense vs profit */}
          <div className="kpi-card">
            <p className="text-xs text-gray-500 mb-1">今月 収支バランス</p>
            <p className="text-xl font-bold">{formatYen(m.revenueJpy ?? 0)}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-green-600">売上</span>
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
              <span className="text-xs text-red-500">経費 {formatYen(m.expenseJpy ?? 0)}</span>
            </div>
          </div>

          {/* Subscription MRR */}
          <div className="kpi-card">
            <p className="text-xs text-gray-500 mb-1">サブスク MRR</p>
            <p className="text-xl font-bold">{formatYen(m.subscriptionMrr ?? 0)}</p>
            <p className="text-xs text-gray-400 mt-1">定期売上（今月）</p>
          </div>
        </div>

        {/* New vs Repeat */}
        <div className="mt-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">新規 vs リピート（今月）</h4>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>新規 {m.newCustomers ?? 0}名</span>
                <span>リピート {m.repeatCustomers ?? 0}名</span>
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
