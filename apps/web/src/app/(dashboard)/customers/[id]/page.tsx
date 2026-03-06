'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, Mail, MapPin, AlertTriangle, PlusCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { formatYen, RANK_LABELS, RANK_COLORS, cn } from '@/lib/utils'

const FOLLOW_TYPES = ['CALL','LINE','MEETING','EMAIL','LETTER','OTHER'] as const
const FOLLOW_TYPE_LABELS: Record<string, string> = {
  CALL: '電話', LINE: 'LINE', MEETING: '面談',
  EMAIL: 'メール', LETTER: 'レター・DM', OTHER: 'その他',
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [customer, setCustomer] = useState<any>(null)
  const [showLogForm, setShowLogForm] = useState(false)
  const [logForm, setLogForm] = useState({
    type: 'CALL', notes: '', outcome: '', nextAction: '', nextDueDate: '',
  })

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
    return <div className="text-center py-16 text-gray-400">読み込み中...</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/customers" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={15} /> 顧客一覧に戻る
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', RANK_COLORS[customer.rank])}>
                {RANK_LABELS[customer.rank]}
              </span>
              {customer.isDormant && (
                <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full font-medium">
                  <AlertTriangle size={12} /> 離脱リスク
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
            <p className="text-xs text-gray-400">累計購入額</p>
            <p className="text-2xl font-bold text-slate-800">{formatYen(customer.cumulativeSpend)}</p>
            <p className="text-xs text-gray-400 mt-1">
              MA-CPS上限: <span className="font-medium text-gray-600">{formatYen(Math.round(customer.maCps ?? 0))}</span>
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">最終購入</p>
            <p className="text-sm font-medium">
              {customer.lastPurchaseDate
                ? `${customer.daysSinceLastPurchase}日前`
                : '購入履歴なし'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">紹介件数</p>
            <p className="text-sm font-medium">{customer.referralsGiven?.length ?? 0}件</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">流入元</p>
            <p className="text-sm font-medium">{customer.acquisitionSource ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Purchase history */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-3">購入履歴</h3>
        {customer.transactions?.length === 0 ? (
          <p className="text-sm text-gray-400">購入履歴がありません</p>
        ) : (
          <div className="space-y-2">
            {customer.transactions?.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{t.product?.name ?? '金額直接入力'}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(t.transactionDate).toLocaleDateString('ja-JP')}
                    {t.note && ` — ${t.note}`}
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatYen(t.amountJpy)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Follow-up log */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">フォロー履歴</h3>
          <button
            onClick={() => setShowLogForm(true)}
            className="flex items-center gap-1.5 text-xs text-slate-700 border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50"
          >
            <PlusCircle size={13} /> フォロー記録
          </button>
        </div>

        {customer.followLogs?.length === 0 ? (
          <p className="text-sm text-gray-400">フォロー履歴がありません</p>
        ) : (
          <div className="space-y-3">
            {customer.followLogs?.map((log: any) => (
              <div key={log.id} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full h-fit whitespace-nowrap">
                  {FOLLOW_TYPE_LABELS[log.type]}
                </span>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-0.5">
                    {new Date(log.logDate).toLocaleDateString('ja-JP')}
                  </p>
                  {log.notes && <p className="text-sm text-gray-700">{log.notes}</p>}
                  {log.outcome && <p className="text-xs text-gray-500">結果: {log.outcome}</p>}
                  {log.nextAction && (
                    <p className="text-xs text-blue-600 mt-1">
                      次のアクション: {log.nextAction}
                      {log.nextDueDate && ` (期限: ${new Date(log.nextDueDate).toLocaleDateString('ja-JP')})`}
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
            <h3 className="text-lg font-bold mb-4">フォロー記録を追加</h3>
            <form onSubmit={submitLog} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">活動種別</label>
                <select
                  value={logForm.type}
                  onChange={(e) => setLogForm({ ...logForm, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  {FOLLOW_TYPES.map((t) => (
                    <option key={t} value={t}>{FOLLOW_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">内容・メモ</label>
                <textarea
                  value={logForm.notes}
                  onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">結果</label>
                <input
                  type="text"
                  value={logForm.outcome}
                  onChange={(e) => setLogForm({ ...logForm, outcome: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">次のアクション</label>
                <input
                  type="text"
                  value={logForm.nextAction}
                  onChange={(e) => setLogForm({ ...logForm, nextAction: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">次回期限</label>
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
                  キャンセル
                </button>
                <button type="submit"
                  className="flex-1 bg-slate-800 text-white rounded-lg py-2 text-sm hover:bg-slate-900">
                  記録する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
