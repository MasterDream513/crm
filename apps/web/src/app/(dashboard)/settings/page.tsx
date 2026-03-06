'use client'
import { useEffect, useState } from 'react'
import { Settings2, Plug, Bell, Info } from 'lucide-react'
import { api } from '@/lib/api'

const INTEGRATION_LABELS: Record<string, { label: string; description: string; phase: string }> = {
  UTAGE:        { label: 'UTAGE',       description: 'メール・LINE配信との自動連携', phase: 'Phase 2' },
  FREEE:        { label: 'Freee',       description: '経費・会計データの自動同期',    phase: 'Phase 2' },
  GA4:          { label: 'Google Analytics 4', description: 'ウェブ流入データの取り込み', phase: 'Phase 2' },
  META_ADS:     { label: 'Meta広告',    description: 'Facebook/Instagram広告費の自動取得', phase: 'Phase 2' },
  CLICK_FUNNELS:{ label: 'ClickFunnels', description: 'ファネル計測データの連携',    phase: 'Phase 2' },
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null)
  const [integrations, setIntegrations] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([
      api.settings?.get().catch(() => null),
      api.integrations?.list().catch(() => []),
    ]).then(([s, ints]) => {
      setSettings(s)
      setIntegrations(ints ?? [])
      setLoaded(true)
    })
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Settings2 size={20} className="text-gray-500" />
        <h2 className="text-xl font-bold text-gray-900">設定</h2>
      </div>

      {/* Tenant settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Info size={15} className="text-gray-400" />
          システム設定（現在の値）
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-gray-600">休眠判定日数</span>
            <span className="font-semibold text-gray-900">
              {settings ? `${settings.churnThresholdDays ?? 90} 日` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-gray-600">MA-CPS マージン率</span>
            <span className="font-semibold text-gray-900">
              {settings ? `${Math.round((settings.maCpsMarginRate ?? 0.60) * 100)} %` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600">MA-CPS 計算式</span>
            <span className="font-mono text-xs text-gray-500">LTV × マージン率</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          ※ これらの値を変更する場合は、開発者にお問い合わせください。
        </p>
      </div>

      {/* Rank definitions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-bold text-gray-800 mb-4">顧客ランク基準</h3>
        <div className="space-y-2 text-xs">
          {[
            { rank: 'RANK_1', label: 'ランク1', range: '購入なし（¥0）' },
            { rank: 'RANK_2', label: 'ランク2', range: '〜¥30,000' },
            { rank: 'RANK_3', label: 'ランク3', range: '〜¥100,000' },
            { rank: 'RANK_4', label: 'ランク4', range: '〜¥500,000' },
            { rank: 'RANK_5', label: 'ランク5', range: '〜¥1,000,000' },
            { rank: 'RANK_6', label: 'ランク6', range: '¥1,000,000超' },
          ].map((r) => (
            <div key={r.rank} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <span className="font-medium text-gray-700">{r.label}</span>
              <span className="text-gray-500">{r.range}（累計購入額）</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">ランクは売上記録時に自動更新されます。</p>
      </div>

      {/* Integrations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
          <Plug size={15} className="text-gray-400" />
          外部連携
        </h3>
        <p className="text-xs text-gray-400 mb-4">Phase 2 でリリース予定の連携機能です。</p>

        <div className="space-y-3">
          {Object.entries(INTEGRATION_LABELS).map(([key, meta]) => {
            const integration = integrations.find((i) => i.type === key)
            const isEnabled = integration?.isEnabled ?? false
            return (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-700">{meta.label}</p>
                  <p className="text-xs text-gray-400">{meta.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium">
                    {meta.phase}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 font-medium ${
                    isEnabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isEnabled ? '有効' : '未設定'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
          <Bell size={20} className="mx-auto mb-2 text-gray-300" />
          <p className="text-xs text-gray-400">
            外部連携の設定は Phase 2 リリース後に有効化されます。<br />
            UTAGEとの自動同期、Freee連携、広告費取り込みに対応予定です。
          </p>
        </div>
      </div>

      {/* Version info */}
      <div className="text-center text-xs text-gray-300 pb-4">
        CRM v1.0 — Phase 1 · {new Date().getFullYear()}
      </div>
    </div>
  )
}
