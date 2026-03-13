import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatYen, formatPercent } from '@/lib/format';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ProductVolumeChart } from '@/components/dashboard/ProductVolumeChart';
import { RevenueExpenseChart } from '@/components/dashboard/RevenueExpenseChart';
import { NewVsRepeatChart } from '@/components/dashboard/NewVsRepeatChart';
import type { DashboardKpi } from '@/types';

const DashboardPage = () => {
  const { t } = useLocale();
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const { data: kpi, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-kpi'],
    queryFn: () => api.kpi.dashboard(),
    refetchOnWindowFocus: false,
  });

  const handleRefresh = () => {
    refetch();
    setLastUpdated(new Date());
  };

  if (isLoading || !kpi) return <DashboardSkeleton />;

  const d = kpi;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('dashboard')}</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {t('lastUpdated')}: {lastUpdated.toLocaleTimeString('ja-JP')}
          </span>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t('refresh')}
          </button>
        </div>
      </div>

      {/* Daily Section */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">{t('todayResults')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title={`${t('revenue')} / ${t('profit')}`}
            value={formatYen(d.daily.revenueJpy)}
            detail={`${t('profit')}: ${formatYen(d.daily.profitJpy)} | ${t('expense')}: ${formatYen(d.daily.expenseJpy)}`}
            borderColor={d.daily.isProfit ? 'hsl(var(--profit))' : 'hsl(var(--loss))'}
            badge={d.daily.isProfit ? { label: t('profitLabel'), variant: 'profit' } : { label: t('lossLabel'), variant: 'loss' }}
            tooltip={t('tooltipDailyRevenue')}
          />
          <KpiCard
            title={t('newCustomers')}
            value={String(d.daily.newCustomers)}
            detail={t('todayNew')}
            borderColor="hsl(var(--chart-indigo))"
            tooltip={t('tooltipNewCustomers')}
          />
          <KpiCard
            title={t('followDone')}
            value={String(d.daily.existingCustomersHandled)}
            detail={t('followDone')}
            borderColor="hsl(var(--chart-blue))"
            tooltip={t('tooltipFollowDone')}
          />
          <KpiCard
            title={t('repeatRate')}
            value={formatPercent(d.daily.repeatRate)}
            borderColor="hsl(var(--chart-emerald))"
            tooltip={t('tooltipRepeatRate')}
          />
          <KpiCard
            title={t('churnRisk')}
            value={String(d.daily.churnRiskCount)}
            detail={t('over90Days')}
            borderColor={d.daily.churnRiskCount > 0 ? 'hsl(var(--warning))' : 'hsl(var(--chart-emerald))'}
            badge={d.daily.churnRiskCount > 0 ? { label: `${d.daily.churnRiskCount}`, variant: 'warning' } : undefined}
            tooltip={t('tooltipChurnRisk')}
          />
        </div>
      </section>

      {/* Weekly Section */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">{t('weeklyMetrics')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <KpiCard
            title={t('cpa')}
            value={formatYen(d.weekly.cpa || 0)}
            tooltip={t('tooltipCpa')}
            borderColor="hsl(var(--chart-indigo))"
          />
          <KpiCard
            title={t('cps')}
            value={formatYen(d.weekly.cps || 0)}
            tooltip={t('tooltipCps')}
            borderColor="hsl(var(--chart-blue))"
          />
          <KpiCard
            title={t('epc')}
            value={formatYen(d.weekly.epc || 0)}
            tooltip={t('tooltipEpc')}
            borderColor="hsl(var(--chart-emerald))"
            badge={d.weekly.epc && d.weekly.cpc && d.weekly.epc > d.weekly.cpc
              ? { label: t('profitLabel'), variant: 'profit' }
              : undefined
            }
          />
          <KpiCard
            title={t('cpc')}
            value={formatYen(d.weekly.cpc || 0)}
            tooltip={t('tooltipCpc')}
            borderColor="hsl(var(--chart-rose))"
            badge={d.weekly.cpc && d.weekly.epc && d.weekly.cpc > d.weekly.epc
              ? { label: t('lossLabel'), variant: 'loss' }
              : undefined
            }
          />
          <KpiCard
            title={t('atv')}
            value={formatYen(d.weekly.atv || 0)}
            tooltip={t('tooltipAtv')}
            borderColor="hsl(var(--chart-amber))"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ProductVolumeChart data={d.weekly.productVolume} />
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-card-foreground mb-2">{t('epcVsCpc')}</h3>
            <EpcVsCpcVisual epc={d.weekly.epc || 0} cpc={d.weekly.cpc || 0} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard
            title={t('referrals')}
            value={String(d.weekly.referralCount)}
            detail={t('weeklyReferrals')}
            borderColor="hsl(var(--chart-indigo))"
            tooltip={t('tooltipReferrals')}
          />
          <KpiCard
            title={t('conversionRate')}
            value={d.weekly.conversionRate != null ? `${d.weekly.conversionRate}%` : '—'}
            detail={d.weekly.totalProspects != null ? `${d.weekly.convertedCount ?? 0} / ${d.weekly.totalProspects} ${t('items')}` : undefined}
            borderColor="hsl(var(--chart-emerald))"
            tooltip={t('tooltipConversion')}
          />
        </div>
      </section>

      {/* Monthly Section */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">{t('monthlyMetrics')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            title={t('ltv')}
            value={formatYen(d.monthly.ltvAvg)}
            detail={t('allCustomersAvg')}
            tooltip={t('tooltipLtv')}
            borderColor="hsl(var(--chart-indigo))"
          />
          <KpiCard
            title={t('maCps')}
            value={formatYen(d.monthly.maCps)}
            detail={`LTV × 60%`}
            tooltip={t('tooltipMaCps')}
            borderColor="hsl(var(--chart-blue))"
          />
          <KpiCard
            title={t('monthlyBalance')}
            value={formatYen(d.monthly.profitJpy)}
            borderColor={d.monthly.isProfit ? 'hsl(var(--profit))' : 'hsl(var(--loss))'}
            badge={d.monthly.isProfit ? { label: t('profitLabel'), variant: 'profit' } : { label: t('lossLabel'), variant: 'loss' }}
            tooltip={t('tooltipMonthlyBalance')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RevenueExpenseChart revenue={d.monthly.revenueJpy} expense={d.monthly.expenseJpy} />
          <NewVsRepeatChart data={d.monthly.newVsRepeat} total={d.monthly.totalCustomers} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            title={t('subscriptionMrr')}
            value={formatYen(d.monthly.subscriptionMrr)}
            detail={d.monthly.subscriptionMembers != null ? `${d.monthly.subscriptionMembers}${t('subscribersActive')}` : undefined}
            borderColor="hsl(var(--chart-indigo))"
            tooltip={t('tooltipSubscriptionMrr')}
            badge={d.monthly.subscriptionChangeRate != null && d.monthly.subscriptionChangeRate !== 0
              ? {
                  label: `${d.monthly.subscriptionChangeRate > 0 ? '+' : ''}${d.monthly.subscriptionChangeRate}%`,
                  variant: d.monthly.subscriptionChangeRate >= 0 ? 'profit' : 'loss',
                }
              : undefined
            }
          />
          <KpiCard
            title={t('newCustomers')}
            value={String(d.monthly.newCustomers)}
            borderColor="hsl(var(--chart-emerald))"
            tooltip={t('tooltipMonthlyNewCustomers')}
          />
          <KpiCard
            title={`${t('repeatRate')}`}
            value={String(d.monthly.repeatCustomers)}
            detail={t('twoPluspurchases')}
            borderColor="hsl(var(--chart-blue))"
            tooltip={t('tooltipRepeatCustomers')}
          />
        </div>
      </section>
    </div>
  );
};

// Simple EPC vs CPC visual comparison
const EpcVsCpcVisual = ({ epc, cpc }: { epc: number; cpc: number }) => {
  const { t } = useLocale();
  const isProfitable = epc > cpc;
  const diff = Math.abs(epc - cpc);
  const max = Math.max(epc, cpc);

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">EPC</span>
          <span className="font-semibold" style={{ color: 'hsl(var(--chart-emerald))' }}>¥{epc.toLocaleString()}</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${(epc / max) * 100}%`, backgroundColor: 'hsl(var(--chart-emerald))' }}
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">CPC</span>
          <span className="font-semibold" style={{ color: 'hsl(var(--chart-rose))' }}>¥{cpc.toLocaleString()}</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${(cpc / max) * 100}%`, backgroundColor: 'hsl(var(--chart-rose))' }}
          />
        </div>
      </div>
      <div
        className="rounded-lg p-3 text-center text-sm font-medium"
        style={{
          backgroundColor: isProfitable ? 'hsl(var(--profit) / 0.1)' : 'hsl(var(--loss) / 0.1)',
          color: isProfitable ? 'hsl(var(--profit))' : 'hsl(var(--loss))',
        }}
      >
        {isProfitable
          ? `${t('adProfitable')} — ¥${diff.toLocaleString()} ${t('profitPerClick')}`
          : `${t('adLoss')} — ¥${diff.toLocaleString()} ${t('lossPerClick')}`
        }
      </div>
    </div>
  );
};

export default DashboardPage;
