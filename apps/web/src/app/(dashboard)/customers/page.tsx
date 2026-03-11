'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, UserPlus, AlertTriangle, Filter } from 'lucide-react'
import { api } from '@/lib/api'
import { formatYen, RANK_COLORS, cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

const RANKS = ['RANK_1','RANK_2','RANK_3','RANK_4','RANK_5','RANK_6']

export default function CustomersPage() {
  const { t, locale } = useI18n()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [rankFilter, setRankFilter] = useState('')
  const [dormantOnly, setDormantOnly] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:'', phone:'', address:'', email:'', acquisitionSource:'', notes:'' })

  async function load() {
    setLoading(true)
    const params: Record<string, string> = {}
    if (q) params.q = q
    if (rankFilter) params.rank = rankFilter
    if (dormantOnly) params.dormant = 'true'
    const data = await api.customers.list(params).catch(() => [])
    setCustomers(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [q, rankFilter, dormantOnly])

  async function createCustomer(e: React.FormEvent) {
    e.preventDefault()
    await api.customers.create(form)
    setShowForm(false)
    setForm({ name:'', phone:'', address:'', email:'', acquisitionSource:'', notes:'' })
    load()
  }

  const dateLocale = locale === 'ja' ? 'ja-JP' : 'en-US'

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{t.customers.title}</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-slate-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors"
        >
          <UserPlus size={15} /> {t.customers.addCustomer}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.customers.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <select
          value={rankFilter}
          onChange={(e) => setRankFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">{t.customers.allRanks}</option>
          {RANKS.map((r) => <option key={r} value={r}>{t.ranks[r as keyof typeof t.ranks]}</option>)}
        </select>
        <button
          onClick={() => setDormantOnly(!dormantOnly)}
          className={cn(
            'flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-colors',
            dormantOnly
              ? 'bg-amber-50 border-amber-400 text-amber-700'
              : 'border-gray-300 text-gray-600 hover:border-gray-400'
          )}
        >
          <AlertTriangle size={14} /> {t.customers.dormantOnly}
        </button>
      </div>

      {/* Customer table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{t.customers.name}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{t.customers.rank}</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">{t.customers.cumulativeSpend}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{t.customers.lastPurchase}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{t.customers.status}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{t.customers.source}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">{t.common.loading}</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">{t.customers.notFound}</td></tr>
            ) : customers.map((c) => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/customers/${c.id}`} className="font-medium text-slate-800 hover:text-blue-600 hover:underline">
                    {c.name}
                  </Link>
                  {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-medium px-2 py-1 rounded-full', RANK_COLORS[c.rank])}>
                    {t.ranks[c.rank as keyof typeof t.ranks]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">{formatYen(c.cumulativeSpend)}</td>
                <td className="px-4 py-3 text-gray-500">
                  {c.lastPurchaseDate
                    ? `${c.daysSinceLastPurchase}${t.common.daysAgo}`
                    : '\u2014'}
                </td>
                <td className="px-4 py-3">
                  {c.isDormant ? (
                    <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                      <AlertTriangle size={12} /> {t.customers.dormantRisk}
                    </span>
                  ) : (
                    <span className="text-xs text-green-600 font-medium">{t.customers.active}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{c.acquisitionSource ?? '\u2014'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New customer modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">{t.customers.newCustomerTitle}</h3>
            <form onSubmit={createCustomer} className="space-y-3">
              {[
                { key: 'name',              label: t.customers.fullName,           required: true  },
                { key: 'phone',             label: t.customers.phone,              required: false },
                { key: 'email',             label: t.customers.email,              required: false },
                { key: 'address',           label: t.customers.address,            required: false },
                { key: 'acquisitionSource', label: t.customers.acquisitionSource,  required: false },
              ].map(({ key, label, required }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={key === 'email' ? 'email' : 'text'}
                    required={required}
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t.customers.notes}</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">
                  {t.common.cancel}
                </button>
                <button type="submit"
                  className="flex-1 bg-slate-800 text-white rounded-lg py-2 text-sm hover:bg-slate-900">
                  {t.customers.register}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
