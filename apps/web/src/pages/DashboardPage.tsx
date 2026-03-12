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
            tooltip="本日の売上・利益・経費 — 赤字なら経費を見直すか売上施策を強化"
          />
          <KpiCard
            title={t('newCustomers')}
            value={String(d.daily.newCustomers)}
            detail={t('todayNew')}
            borderColor="hsl(var(--chart-indigo))"
            tooltip="本日獲得した新規顧客数 — 少ない場合は集客チャネルを確認"
          />
          <KpiCard
            title={t('followDone')}
            value={String(d.daily.existingCustomersHandled)}
            detail={t('followDone')}
            borderColor="hsl(var(--chart-blue))"
            tooltip="本日実施したフォローアップ件数 — 目標件数を決めて毎日チェック"
          />
          <KpiCard
            title={t('repeatRate')}
            value={formatPercent(d.daily.repeatRate)}
            borderColor="hsl(var(--chart-emerald))"
            tooltip="リピーター率 — 低い場合はフォロー頻度やオファーを見直す"
          />
          <KpiCard
            title={t('churnRisk')}
            value={String(d.daily.churnRiskCount)}
            detail={t('over90Days')}
            borderColor={d.daily.churnRiskCount > 0 ? 'hsl(var(--warning))' : 'hsl(var(--chart-emerald))'}
            badge={d.daily.churnRiskCount > 0 ? { label: `${d.daily.churnRiskCount}`, variant: 'warning' } : undefined}
            tooltip="90日以上未購入の顧客数 — 多い場合は再来店キャンペーンを検討"
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
            tooltip="広告費 ÷ 新規顧客数 — 低いほど効率的。高い場合は広告クリエイティブやターゲティングを見直す"
            borderColor="hsl(var(--chart-indigo))"
          />
          <KpiCard
            title={t('cps')}
            value={formatYen(d.weekly.cps || 0)}
            tooltip="広告費 ÷ 販売件数 — MA-CPSを超えていたら広告費の削減を検討"
            borderColor="hsl(var(--chart-blue))"
          />
          <KpiCard
            title={t('epc')}
            value={formatYen(d.weekly.epc || 0)}
            tooltip="売上 ÷ クリック数 — CPCより高ければ黒字。LP改善で向上可能"
            borderColor="hsl(var(--chart-emerald))"
            badge={d.weekly.epc && d.weekly.cpc && d.weekly.epc > d.weekly.cpc
              ? { label: t('profitLabel'), variant: 'profit' }
              : undefined
            }
          />
          <KpiCard
            title={t('cpc')}
            value={formatYen(d.weekly.cpc || 0)}
            tooltip="広告費 ÷ クリック数 — EPCより低ければ黒字。入札戦略で調整"
            borderColor="hsl(var(--chart-rose))"
            badge={d.weekly.cpc && d.weekly.epc && d.weekly.cpc > d.weekly.epc
              ? { label: t('lossLabel'), variant: 'loss' }
              : undefined
            }
          />
          <KpiCard
            title={t('atv')}
            value={formatYen(d.weekly.atv || 0)}
            tooltip="平均取引額 — アップセルやセット販売で向上。低下傾向なら商品構成を見直す"
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
            tooltip="今週の紹介件数 — 紹介プログラムの活性度を示す。顧客満足度の先行指標"
          />
          <KpiCard
            title={t('conversionRate')}
            value={d.weekly.conversionRate != null ? `${d.weekly.conversionRate}%` : '—'}
            detail={d.weekly.totalProspects != null ? `${d.weekly.convertedCount ?? 0} / ${d.weekly.totalProspects} 件` : undefined}
            borderColor="hsl(var(--chart-emerald))"
            tooltip="潜在顧客→顧客の引き上げ率 — 低い場合はナーチャリング施策やセミナー参加を促進"
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
            tooltip="全顧客の平均累計売上 — 高いほどビジネスの収益力が強い。フォローとリピート施策で向上"
            borderColor="hsl(var(--chart-indigo))"
          />
          <KpiCard
            title={t('maCps')}
            value={formatYen(d.monthly.maCps)}
            detail={`LTV × 60%`}
            tooltip="顧客獲得の上限コスト — CPAがこれを超えると赤字。広告費の基準値として使用"
            borderColor="hsl(var(--chart-blue))"
          />
          <KpiCard
            title={t('monthlyBalance')}
            value={formatYen(d.monthly.profitJpy)}
            borderColor={d.monthly.isProfit ? 'hsl(var(--profit))' : 'hsl(var(--loss))'}
            badge={d.monthly.isProfit ? { label: t('profitLabel'), variant: 'profit' } : { label: t('lossLabel'), variant: 'loss' }}
            tooltip="月間の売上 − 経費 — 赤字が続く場合は経費削減か単価アップを検討"
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
            detail={d.monthly.subscriptionMembers != null ? `${d.monthly.subscriptionMembers}名が継続中` : undefined}
            borderColor="hsl(var(--chart-indigo))"
            tooltip="月額・年額サブスクの合計月間収益 — 安定収益の柱。解約率に注意"
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
            tooltip="今月の新規顧客数 — 集客チャネルの効果を示す。減少傾向なら広告やSEOを強化"
          />
          <KpiCard
            title={`${t('repeatRate')}`}
            value={String(d.monthly.repeatCustomers)}
            detail="2回以上購入"
            borderColor="hsl(var(--chart-blue))"
            tooltip="リピーター数 — LTV向上の鍵。フォロー施策や定期購入プランで増加を目指す"
          />
        </div>
      </section>
    </div>
  );
};

// Simple EPC vs CPC visual comparison
const EpcVsCpcVisual = ({ epc, cpc }: { epc: number; cpc: number }) => {
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
          ? `✅ 黒字 — クリックあたり ¥${diff.toLocaleString()} の利益`
          : `⚠️ 赤字 — クリックあたり ¥${diff.toLocaleString()} の損失`
        }
      </div>
    </div>
  );
};

export default DashboardPage;
