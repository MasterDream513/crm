'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, Mail, MapPin, AlertTriangle, PlusCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { formatYen, RANK_COLORS, cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

const FOLLOW_TYPES = ['CALL','LINE','MEETING','EMAIL','LETTER','OTHER'] as const

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, locale } = useI18n()

  const FOLLOW_TYPE_LABELS: Record<string, string> = {
    CALL: t.followTypes.CALL,
    LINE: t.followTypes.LINE,
    MEETING: t.followTypes.MEETING,
    EMAIL: t.followTypes.EMAIL,
    LETTER: t.followTypes.LETTER,
    OTHER: t.followTypes.OTHER,
  }

  const [customer, setCustomer] = useState<any>(null)
  const [showLogForm, setShowLogForm] = useState(false)
  const [logForm, setLogForm] = useState({
    type: 'CALL', notes: '', outcome: '', nextAction: '', nextDueDate: '',
  })

  const dateLocale = locale === 'ja' ? 'ja-JP' : 'en-US'

  async function load() {
    const data = await api.customers.get(id).catch(() => null)
    setCustomer(data)
  }

  useEffect(() => { load() }, [id])

  async function submitLog(e: React.FormEvent) {
    e.preventDefault()
    await api.followLogs.create({
      customerId: id,
      type: logForm.type,
      logDate: new Date().toISOString(),
      notes: logForm.notes,
      outcome: logForm.outcome,
      nextAction: logForm.nextAction,
      nextDueDate: logForm.nextDueDate || undefined,
    })
    setShowLogForm(false)
    setLogForm({ type: 'CALL', notes: '', outcome: '', nextAction: '', nextDueDate: '' })
    load()
  }

  if (!customer) {
    return <div className="text-center py-16 text-gray-400">{t.common.loading}</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/customers" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={15} /> {t.customerDetail.backToList}
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', RANK_COLORS[customer.rank])}>
                {t.ranks[customer.rank as keyof typeof t.ranks]}
              </span>
              {customer.isDormant && (
                <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full font-medium">
                  <AlertTriangle size={12} /> {t.customers.dormantRisk}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              {customer.phone && <span className="flex items-center gap-1"><Phone size={13} />{customer.phone}</span>}
              {customer.email && <span className="flex items-center gap-1"><Mail size={13} />{customer.email}</span>}
              {customer.address && <span className="flex items-center gap-1"><MapPin size={13} />{customer.address}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">{t.customerDetail.cumulativeSpend}</p>
            <p className="text-2xl font-bold text-slate-800">{formatYen(customer.cumulativeSpend)}</p>
            <p className="text-xs text-gray-400 mt-1">
              {t.customerDetail.maCpsLimit} <span className="font-medium text-gray-600">{formatYen(Math.round(customer.maCps ?? 0))}</span>
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">{t.customerDetail.lastPurchase}</p>
            <p className="text-sm font-medium">
              {customer.lastPurchaseDate
                ? `${customer.daysSinceLastPurchase}${t.common.daysAgo}`
                : t.customerDetail.noPurchaseHistory}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">{t.customerDetail.referralCount}</p>
            <p className="text-sm font-medium">{customer.referralsGiven?.length ?? 0}{t.common.unit_items}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">{t.customerDetail.source}</p>
            <p className="text-sm font-medium">{customer.acquisitionSource ?? '\u2014'}</p>
          </div>
        </div>
      </div>

      {/* Purchase history */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-3">{t.customerDetail.purchaseHistory}</h3>
        {customer.transactions?.length === 0 ? (
          <p className="text-sm text-gray-400">{t.customerDetail.noPurchases}</p>
        ) : (
          <div className="space-y-2">
            {customer.transactions?.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{tx.product?.name ?? t.customerDetail.directAmountEntry}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.transactionDate).toLocaleDateString(dateLocale)}
                    {tx.note && ` \u2014 ${tx.note}`}
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatYen(tx.amountJpy)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Follow-up log */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">{t.customerDetail.followUpHistory}</h3>
          <button
            onClick={() => setShowLogForm(true)}
            className="flex items-center gap-1.5 text-xs text-slate-700 border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50"
          >
            <PlusCircle size={13} /> {t.customerDetail.addFollowLog}
          </button>
        </div>

        {customer.followLogs?.length === 0 ? (
          <p className="text-sm text-gray-400">{t.customerDetail.noFollowHistory}</p>
        ) : (
          <div className="space-y-3">
            {customer.followLogs?.map((log: any) => (
              <div key={log.id} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full h-fit whitespace-nowrap">
                  {FOLLOW_TYPE_LABELS[log.type]}
                </span>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-0.5">
                    {new Date(log.logDate).toLocaleDateString(dateLocale)}
                  </p>
                  {log.notes && <p className="text-sm text-gray-700">{log.notes}</p>}
                  {log.outcome && <p className="text-xs text-gray-500">{t.customerDetail.resultLabel} {log.outcome}</p>}
                  {log.nextAction && (
                    <p className="text-xs text-blue-600 mt-1">
                      {t.customerDetail.nextActionLabel} {log.nextAction}
                      {log.nextDueDate && ` (${t.customerDetail.deadline} ${new Date(log.nextDueDate).toLocaleDateString(dateLocale)})`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Follow log modal */}
      {showLogForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">{t.customerDetail.addFollowTitle}</h3>
            <form onSubmit={submitLog} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t.customerDetail.activityType}</label>
                <select
                  value={logForm.type}
                  onChange={(e) => setLogForm({ ...logForm, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  {FOLLOW_TYPES.map((ft) => (
                    <option key={ft} value={ft}>{FOLLOW_TYPE_LABELS[ft]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t.customerDetail.contentNotes}</label>
                <textarea
                  value={logForm.notes}
                  onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t.customerDetail.outcome}</label>
                <input
                  type="text"
                  value={logForm.outcome}
                  onChange={(e) => setLogForm({ ...logForm, outcome: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t.customerDetail.nextAction}</label>
                <input
                  type="text"
                  value={logForm.nextAction}
                  onChange={(e) => setLogForm({ ...logForm, nextAction: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t.customerDetail.nextDueDate}</label>
                <input
                  type="datetime-local"
                  value={logForm.nextDueDate}
                  onChange={(e) => setLogForm({ ...logForm, nextDueDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowLogForm(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">
                  {t.common.cancel}
                </button>
                <button type="submit"
                  className="flex-1 bg-slate-800 text-white rounded-lg py-2 text-sm hover:bg-slate-900">
                  {t.customerDetail.record}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
