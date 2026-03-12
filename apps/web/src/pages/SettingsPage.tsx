import { useLocale } from '@/contexts/LocaleContext';
import { formatYen } from '@/lib/format';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Settings, Shield, Link2, Star } from 'lucide-react';

const rankTiers = [
  { rank: 'RANK_1', label: '無料会員', threshold: '¥0', color: 'hsl(var(--rank-1))' },
  { rank: 'RANK_2', label: '一般客', threshold: '〜¥30,000', color: 'hsl(var(--rank-2))' },
  { rank: 'RANK_3', label: '優良客', threshold: '〜¥100,000', color: 'hsl(var(--rank-3))' },
  { rank: 'RANK_4', label: 'VIP予備', threshold: '〜¥500,000', color: 'hsl(var(--rank-4))' },
  { rank: 'RANK_5', label: 'VIP', threshold: '〜¥1,000,000', color: 'hsl(var(--rank-5))' },
  { rank: 'RANK_6', label: 'スーパーVIP', threshold: '¥1,000,000+', color: 'hsl(var(--rank-6))' },
];

const integrationDisplayMap: Record<string, { name: string; desc: string }> = {
  UTAGE: { name: 'UTAGE', desc: 'webhook受信' },
  FREEE: { name: 'Freee', desc: '会計連携' },
  GOOGLE_ANALYTICS: { name: 'Google Analytics', desc: 'アクセス解析' },
  META_ADS: { name: 'Meta Ads', desc: '広告連携' },
  CLICKFUNNELS: { name: 'ClickFunnels', desc: 'ファネル連携' },
};

const SettingsPage = () => {
  const { t } = useLocale();

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.settings.get(),
  });

  const { data: integrations, isLoading: integrationsLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => api.integrations.list(),
  });

  const isLoading = settingsLoading || integrationsLoading;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">{t('settings')}</h1>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  const dormantDays = `${(settings?.churnThresholdDays as number) ?? 90}日`;
  const marginRate = (settings?.maCpsMarginRate as number) ?? 0.60;
  const profitMargin = `${marginRate * 100}%`;
  const maCpsFormula = `LTV × ${marginRate * 100}%`;
  const currency = (settings?.currency as string) ?? 'JPY';
  const timezone = (settings?.timezone as string) ?? 'Asia/Tokyo';

  const integrationItems = (integrations ?? []).map((integ) => {
    const display = integrationDisplayMap[integ.type] ?? { name: integ.type, desc: '' };
    return { ...display, enabled: integ.enabled };
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">{t('settings')}</h1>

      {/* System Settings */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          {t('systemSettings')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: t('dormantDays'), value: dormantDays },
            { label: t('profitMargin'), value: profitMargin },
            { label: 'MA-CPS計算式', value: maCpsFormula },
            { label: t('currency'), value: currency },
            { label: t('timezone'), value: timezone },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-lg font-semibold text-card-foreground mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Rank Criteria */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          {t('rankCriteria')}
        </h2>
        <div className="space-y-2">
          {rankTiers.map((tier, i) => (
            <div
              key={tier.rank}
              className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm"
              style={{ borderLeftWidth: '3px', borderLeftColor: tier.color }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: `${tier.color}20`, color: tier.color }}>
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-card-foreground">{tier.label}</p>
              </div>
              <p className="text-sm font-medium text-muted-foreground">{tier.threshold}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          {t('integrations')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {integrationItems.map((integ) => (
            <div key={integ.name} className="card-hover rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-card-foreground">{integ.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{integ.desc}</p>
                </div>
                <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground">
                  {t('phase2')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
