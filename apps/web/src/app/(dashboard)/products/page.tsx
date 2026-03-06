'use client'
import { useEffect, useState } from 'react'
import { PlusCircle, Pencil, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { formatYen } from '@/lib/utils'

const CATEGORY_LABELS: Record<string, string> = {
  LIST_ACQUISITION: 'リスト獲得',
  INDIVIDUAL:       '個別面談',
  SEMINAR:          'セミナー',
  ONLINE_COURSE:    'オンライン教材',
  SUBSCRIPTION:     'サブスク',
}
const BILLING_LABELS: Record<string, string> = {
  ONE_TIME:           '一回払い',
  RECURRING_MONTHLY:  '月次定期',
  RECURRING_ANNUAL:   '年次定期',
}

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({
    name: '', priceJpy: '', category: 'SEMINAR', billingType: 'ONE_TIME', isActive: true,
  })

  async function load() {
    const data = await api.products.list().catch(() => [])
    setProducts(data)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditing(null)
    setForm({ name: '', priceJpy: '', category: 'SEMINAR', billingType: 'ONE_TIME', isActive: true })
    setShowForm(true)
  }

  function openEdit(p: any) {
    setEditing(p)
    setForm({ name: p.name, priceJpy: String(p.priceJpy), category: p.category, billingType: p.billingType, isActive: p.isActive })
    setShowForm(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const data = { ...form, priceJpy: parseInt(form.priceJpy) }
    if (editing) await api.products.update(editing.id, data)
    else await api.products.create(data)
    setShowForm(false)
    load()
  }

  async function remove(id: string) {
    if (!confirm('この商品を削除しますか？')) return
    await api.products.delete(id)
    load()
  }

  const grouped = products.reduce((acc: any, p) => {
    const k = p.category
    if (!acc[k]) acc[k] = []
    acc[k].push(p)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">商品管理</h2>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-slate-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-900">
          <PlusCircle size={15} /> 商品追加
        </button>
      </div>

      {(Object.entries(grouped) as [string, any[]][]).map(([cat, items]) => (
        <div key={cat} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-600">{CATEGORY_LABELS[cat] ?? cat}</h3>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`font-medium ${p.isActive ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                      {p.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatYen(p.priceJpy)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{BILLING_LABELS[p.billingType]}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)}
                        className="text-gray-400 hover:text-slate-700 p-1"><Pencil size={14} /></button>
                      <button onClick={() => remove(p.id)}
                        className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">{editing ? '商品を編集' : '商品を追加'}</h3>
            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">商品名 *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">金額（円・税込） *</label>
                <input required type="number" min="0" value={form.priceJpy}
                  onChange={(e) => setForm({ ...form, priceJpy: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">カテゴリ</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">課金タイプ</label>
                <select value={form.billingType} onChange={(e) => setForm({ ...form, billingType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  {Object.entries(BILLING_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-gray-300" />
                <label htmlFor="isActive" className="text-xs text-gray-700">販売中</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">
                  キャンセル
                </button>
                <button type="submit"
                  className="flex-1 bg-slate-800 text-white rounded-lg py-2 text-sm hover:bg-slate-900">
                  保存する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
