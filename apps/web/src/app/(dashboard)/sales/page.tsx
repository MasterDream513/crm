'use client'
import { useEffect, useState } from 'react'
import { PlusCircle, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { api } from '@/lib/api'
import { formatYen } from '@/lib/utils'

export default function SalesPage() {
  const [products, setProducts] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [summary, setSummary] = useState<{ daily: any; weekly: any; monthly: any }>({
    daily: null, weekly: null, monthly: null,
  })
  const [mode, setMode] = useState<'product' | 'free'>('product')
  const [form, setForm] = useState({
    customerId: '', productId: '', amountJpy: '',
    billingType: 'ONE_TIME', subscriptionStatus: '',
    transactionDate: new Date().toISOString().slice(0, 16), note: '',
  })
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  useEffect(() => {
    Promise.all([
      api.products.list(),
      api.customers.list(),
      api.transactions.summary('daily'),
      api.transactions.summary('weekly'),
      api.transactions.summary('monthly'),
    ]).then(([prods, custs, daily, weekly, monthly]) => {
      setProducts(prods)
      setCustomers(custs)
      setSummary({ daily, weekly, monthly })
    })
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const selectedProduct = products.find((p) => p.id === form.productId)
    await api.transactions.create({
      customerId: form.customerId,
      productId: mode === 'product' ? form.productId || undefined : undefined,
      amountJpy: mode === 'product' && selectedProduct
        ? selectedProduct.priceJpy
        : parseInt(form.amountJpy),
      billingType: form.billingType,
      subscriptionStatus: form.subscriptionStatus || undefined,
      transactionDate: new Date(form.transactionDate).toISOString(),
      note: form.note,
    })
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    // Refresh summaries
    const [daily, weekly, monthly] = await Promise.all([
      api.transactions.summary('daily'),
      api.transactions.summary('weekly'),
      api.transactions.summary('monthly'),
    ])
    setSummary({ daily, weekly, monthly })
  }

  const s = summary[activeTab]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-gray-900">売上入力 & 集計</h2>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Entry form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">売上を記録する</h3>

          {/* Mode toggle */}
          <div className="flex rounded-lg border border-gray-200 mb-4 p-0.5 bg-gray-50">
            {(['product', 'free'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 text-xs py-2 rounded-md font-medium transition-all ${
                  mode === m ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}
              >
                {m === 'product' ? '商品から選ぶ' : '金額を直接入力（割引・セット）'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Customer select */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">顧客 *</label>
              <select
                required
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                <option value="">顧客を選択...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Product or amount */}
            {mode === 'product' ? (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">商品 *</label>
                <select
                  required
                  value={form.productId}
                  onChange={(e) => {
                    const p = products.find((p) => p.id === e.target.value)
                    setForm({
                      ...form,
                      productId: e.target.value,
                      billingType: p?.billingType ?? 'ONE_TIME',
                    })
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="">商品を選択...</option>
                  {products.filter(p => p.isActive).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatYen(p.priceJpy)}
                    </option>
                  ))}
                </select>
                {form.productId && (
                  <p className="text-xs text-gray-400 mt-1">
                    金額: {formatYen(products.find(p => p.id === form.productId)?.priceJpy ?? 0)}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">金額（円・税込） *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.amountJpy}
                  onChange={(e) => setForm({ ...form, amountJpy: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  placeholder="例: 30000"
                />
              </div>
            )}

            {/* Subscription status (if recurring) */}
            {form.billingType === 'RECURRING_MONTHLY' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">サブスク状態</label>
                <select
                  value={form.subscriptionStatus}
                  onChange={(e) => setForm({ ...form, subscriptionStatus: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="ACTIVE">継続中</option>
                  <option value="PAUSED">一時停止</option>
                  <option value="CANCELLED">解約</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">取引日時</label>
              <input
                type="datetime-local"
                value={form.transactionDate}
                onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">メモ</label>
              <input
                type="text"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                placeholder="割引理由・備考など"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-800 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-slate-900 transition-colors"
            >
              売上を記録する
            </button>

            {success && (
              <p className="text-center text-sm text-green-600 font-medium">✅ 記録しました</p>
            )}
          </form>
        </div>

        {/* Summary panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800">集計</h3>
            <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs">
              {(['daily', 'weekly', 'monthly'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    activeTab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {t === 'daily' ? '今日' : t === 'weekly' ? '今週' : '今月'}
                </button>
              ))}
            </div>
          </div>

          {s && (
            <div className="space-y-4">
              <div className={`rounded-lg p-4 ${s.isProfit ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className="text-xs text-gray-500 mb-1">売上</p>
                <p className="text-3xl font-bold">{formatYen(s.revenueJpy)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {s.isProfit
                    ? <TrendingUp size={14} className="text-green-600" />
                    : <TrendingDown size={14} className="text-red-600" />}
                  <span className={`text-sm font-semibold ${s.isProfit ? 'text-green-600' : 'text-red-600'}`}>
                    {s.isProfit ? '黒字' : '赤字'} {formatYen(Math.abs(s.profitJpy))}
                  </span>
                  {s.vsLastPeriod !== null && s.vsLastPeriod !== undefined && (
                    <span className="text-xs text-gray-400 ml-2">
                      前期比 {s.vsLastPeriod >= 0 ? '+' : ''}{s.vsLastPeriod.toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">経費: {formatYen(s.expenseJpy)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">取引件数</p>
                  <p className="text-xl font-bold">{s.transactionCount}件</p>
                </div>
              </div>

              {/* Product volume (weekly/monthly) */}
              {s.productVolume && Object.keys(s.productVolume).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                    <BarChart3 size={12} /> 商品別
                  </p>
                  <div className="space-y-1.5">
                    {Object.values(s.productVolume)
                      .sort((a: any, b: any) => b.revenue - a.revenue)
                      .slice(0, 5)
                      .map((v: any) => (
                        <div key={v.name} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 truncate max-w-[60%]">{v.name}</span>
                          <span className="font-medium">{v.count}件 / {formatYen(v.revenue)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
