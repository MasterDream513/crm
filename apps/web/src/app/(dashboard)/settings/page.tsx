'use client'
import { useEffect, useState } from 'react'
import { Settings2, Plug, Bell, Info } from 'lucide-react'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'

export default function SettingsPage() {
  const { t, locale } = useI18n()

  const INTEGRATION_LABELS: Record<string, { label: string; description: string; phase: string }> = {
    UTAGE:        { label: 'UTAGE',       description: t.settings.utageDesc,        phase: 'Phase 2' },
    FREEE:        { label: 'Freee',       description: t.settings.freeeDesc,        phase: 'Phase 2' },
    GA4:          { label: 'Google Analytics 4', description: t.settings.ga4Desc,   phase: 'Phase 2' },
    META_ADS:     { label: 'Meta Ads',    description: t.settings.metaDesc,         phase: 'Phase 2' },
    CLICK_FUNNELS:{ label: 'ClickFunnels', description: t.settings.clickFunnelsDesc, phase: 'Phase 2' },
  }

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

  const rankKeys = ['RANK_1', 'RANK_2', 'RANK_3', 'RANK_4', 'RANK_5', 'RANK_6'] as const

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Settings2 size={20} className="text-gray-500" />
        <h2 className="text-xl font-bold text-gray-900">{t.settings.title}</h2>
      </div>

      {/* Tenant settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Info size={15} className="text-gray-400" />
          {t.settings.systemSettings}
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-gray-600">{t.settings.churnDays}</span>
            <span className="font-semibold text-gray-900">
              {settings ? `${settings.churnThresholdDays ?? 90} 日` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-gray-600">{t.settings.marginRate}</span>
            <span className="font-semibold text-gray-900">
              {settings ? `${Math.round((settings.maCpsMarginRate ?? 0.60) * 100)} %` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600">{t.settings.maCpsFormula}</span>
            <span className="font-mono text-xs text-gray-500">{t.settings.maCpsFormulaValue}</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          {t.settings.changeNote}
        </p>
      </div>

      {/* Rank definitions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-bold text-gray-800 mb-4">{t.settings.rankCriteria}</h3>
        <div className="space-y-2 text-xs">
          {rankKeys.map((rank) => (
            <div key={rank} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <span className="font-medium text-gray-700">{t.ranks[rank]}</span>
              <span className="text-gray-500">{t.rankRanges[rank]}{'(' + t.customerDetail.cumulativeSpend + ')'}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">{t.settings.rankAutoUpdate}</p>
      </div>

      {/* Integrations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
          <Plug size={15} className="text-gray-400" />
          {t.settings.integrations}
        </h3>
        <p className="text-xs text-gray-400 mb-4">{t.settings.integrationsPhaseNote}</p>

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
                    {isEnabled ? t.settings.enabled : t.settings.notConfigured}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
          <Bell size={20} className="mx-auto mb-2 text-gray-300" />
          <p className="text-xs text-gray-400 whitespace-pre-line">
            {t.settings.integrationsComingSoon}
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
