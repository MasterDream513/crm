import { useState, useEffect } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings, Link2, Star, Save } from 'lucide-react';
import { toast } from 'sonner';

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
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.settings.get(),
  });

  const { data: integrations, isLoading: integrationsLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => api.integrations.list(),
  });

  const [form, setForm] = useState({
    churnThresholdDays: 90,
    maCpsMarginRate: 60,
    currency: 'JPY',
    timezone: 'Asia/Tokyo',
  });

  useEffect(() => {
    if (settings) {
      setForm({
        churnThresholdDays: (settings.churnThresholdDays as number) ?? 90,
        maCpsMarginRate: ((settings.maCpsMarginRate as number) ?? 0.60) * 100,
        currency: (settings.currency as string) ?? 'JPY',
        timezone: (settings.timezone as string) ?? 'Asia/Tokyo',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.settings.update({
        churnThresholdDays: form.churnThresholdDays,
        maCpsMarginRate: form.maCpsMarginRate / 100,
        currency: form.currency,
        timezone: form.timezone,
      });
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('設定を保存しました');
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

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

  const integrationItems = (integrations ?? []).map((integ) => {
    const display = integrationDisplayMap[integ.type] ?? { name: integ.type, desc: '' };
    return { ...display, enabled: integ.enabled };
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('settings')}</h1>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            {t('edit')}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? '保存中...' : t('save')}
            </button>
          </div>
        )}
      </div>

      {/* System Settings */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          {t('systemSettings')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">{t('dormantDays')}</p>
            {editing ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={form.churnThresholdDays}
                  onChange={(e) => setForm({ ...form, churnThresholdDays: parseInt(e.target.value) || 90 })}
                  min={1}
                  max={365}
                  className="w-full rounded-lg border bg-background px-3 py-1.5 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <span className="text-sm text-muted-foreground">日</span>
              </div>
            ) : (
              <p className="text-lg font-semibold text-card-foreground">{form.churnThresholdDays}日</p>
            )}
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">{t('profitMargin')}</p>
            {editing ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={form.maCpsMarginRate}
                  onChange={(e) => setForm({ ...form, maCpsMarginRate: parseInt(e.target.value) || 60 })}
                  min={1}
                  max={100}
                  className="w-full rounded-lg border bg-background px-3 py-1.5 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <span className="text-lg font-semibold">%</span>
              </div>
            ) : (
              <p className="text-lg font-semibold text-card-foreground">{form.maCpsMarginRate}%</p>
            )}
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">MA-CPS計算式</p>
            <p className="text-lg font-semibold text-card-foreground">LTV × {form.maCpsMarginRate}%</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">{t('currency')}</p>
            <p className="text-lg font-semibold text-card-foreground">{form.currency}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">{t('timezone')}</p>
            <p className="text-lg font-semibold text-card-foreground">{form.timezone}</p>
          </div>
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
