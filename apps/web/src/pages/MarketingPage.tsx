import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from '@/contexts/LocaleContext';
import { formatYen } from '@/lib/format';
import { api } from '@/lib/api';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, Legend } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import EnterFunnelDataModal from '@/components/modals/EnterFunnelDataModal';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

const MarketingPage = () => {
  const { t } = useLocale();
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: funnelRecords = [], isLoading } = useQuery({
    queryKey: ['marketing-funnel'],
    queryFn: () => api.marketingFunnel.list(),
  });

  const trendData = [...funnelRecords]
    .reverse()
    .slice(-8)
    .map((record) => ({
      week: formatDate(record.recordDate),
      epc: record.epc || 0,
      cpc: record.cpc || 0,
      cpa: record.cpa || 0,
      maCps: record.maCps || 0,
      atv: record.atv || 0,
    }));

  const latest = trendData.length > 0
    ? trendData[trendData.length - 1]
    : { epc: 0, cpc: 0, cpa: 0, maCps: 0, atv: 0 };

  const isProfitable = latest.epc > latest.cpc;
  const isCpaSafe = latest.cpa < latest.maCps;

  const diagnostics = [
    {
      label: t('diagCpcGtEpc'),
      status: latest.cpc > latest.epc ? 'danger' : 'ok',
      diagnosis: latest.cpc > latest.epc ? t('diagCpcGtEpcBad') : t('diagCpcGtEpcGood'),
      icon: latest.cpc > latest.epc ? AlertTriangle : CheckCircle,
    },
    {
      label: t('diagCpaGtMaCps'),
      status: latest.cpa > latest.maCps ? 'danger' : 'ok',
      diagnosis: latest.cpa > latest.maCps ? t('diagCpaGtMaCpsBad') : t('diagCpaGtMaCpsGood'),
      icon: latest.cpa > latest.maCps ? AlertTriangle : CheckCircle,
    },
    {
      label: t('diagAtvLow'),
      status: 'ok',
      diagnosis: t('diagAtvLowMsg'),
      icon: AlertCircle,
    },
    {
      label: t('diagLtvHighCpcLoss'),
      status: isProfitable ? 'na' : 'info',
      diagnosis: t('diagLtvHighCpcLossMsg'),
      icon: CheckCircle,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('marketingAnalysis')}</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          {t('enterFunnelData')}
        </button>
      </div>

      {funnelRecords.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 shadow-sm text-center space-y-3">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-lg font-semibold text-card-foreground">{t('noDataYet')}</p>
          <p className="text-sm text-muted-foreground">
            {t('funnelEmptyMessage')}
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity mt-2"
          >
            <Plus className="h-4 w-4" />
            {t('enterFunnelData')}
          </button>
        </div>
      ) : (
        <>
          {/* Ad Performance Overview */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">{t('adPerformance')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <KpiCard title={t('cpa')} value={formatYen(latest.cpa)} borderColor="hsl(var(--chart-indigo))" tooltip={t('tooltipCpaShort')} />
              <KpiCard title={t('cps')} value={formatYen(latest.cpa)} borderColor="hsl(var(--chart-blue))" tooltip={t('tooltipCpsShort')} />
              <KpiCard title={t('epc')} value={formatYen(latest.epc)} borderColor="hsl(var(--chart-emerald))" tooltip={t('tooltipEpcShort')} />
              <KpiCard title={t('cpc')} value={formatYen(latest.cpc)} borderColor="hsl(var(--chart-rose))" tooltip={t('tooltipCpcShort')} />
            </div>
          </section>

          {/* Ad Efficiency */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">{t('adEfficiency')}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* EPC vs CPC */}
              <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">EPC</p>
                    <p className="text-2xl font-bold" style={{ color: 'hsl(var(--chart-emerald))' }}>{formatYen(latest.epc)}</p>
                  </div>
                  <span className="text-lg text-muted-foreground">vs</span>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">CPC</p>
                    <p className="text-2xl font-bold" style={{ color: 'hsl(var(--chart-rose))' }}>{formatYen(latest.cpc)}</p>
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
                    ? `${t('adProfitable')} — ¥${(latest.epc - latest.cpc).toLocaleString()} ${t('profitPerClick')}`
                    : `${t('adLoss')} — ¥${(latest.cpc - latest.epc).toLocaleString()} ${t('lossPerClick')}`
                  }
                </div>
              </div>

              {/* CPA vs MA-CPS */}
              <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">CPA</p>
                    <p className="text-2xl font-bold" style={{ color: 'hsl(var(--chart-rose))' }}>{formatYen(latest.cpa)}</p>
                  </div>
                  <span className="text-lg text-muted-foreground">vs</span>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">MA-CPS</p>
                    <p className="text-2xl font-bold" style={{ color: 'hsl(var(--chart-blue))' }}>{formatYen(latest.maCps)}</p>
                  </div>
                </div>
                <div
                  className="rounded-lg p-3 text-center text-sm font-medium"
                  style={{
                    backgroundColor: isCpaSafe ? 'hsl(var(--profit) / 0.1)' : 'hsl(var(--loss) / 0.1)',
                    color: isCpaSafe ? 'hsl(var(--profit))' : 'hsl(var(--loss))',
                  }}
                >
                  {isCpaSafe ? t('cpaSafe') : t('cpaOver')}
                </div>
              </div>

              {/* ATV */}
              <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
                <p className="text-xs text-muted-foreground">{t('atv')}</p>
                <p className="text-3xl font-bold text-foreground">{formatYen(latest.atv)}</p>
                <p className="text-xs text-muted-foreground">{t('clickFunnelsDesc')}</p>
              </div>
            </div>
          </section>

          {/* Funnel Diagnosis */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">{t('funnelDiagnosis')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {diagnostics.map((d, i) => {
                const Icon = d.icon;
                const isGood = d.status === 'ok' || d.status === 'na';
                return (
                  <div key={i} className="card-hover rounded-xl border bg-card p-4 shadow-sm flex items-start gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
                      style={{
                        backgroundColor: isGood ? 'hsl(var(--profit) / 0.1)' : 'hsl(var(--loss) / 0.1)',
                      }}
                    >
                      <Icon className="h-4 w-4" style={{ color: isGood ? 'hsl(var(--profit))' : 'hsl(var(--loss))' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">{d.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{d.diagnosis}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Trend Charts */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">{t('trendCharts')}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-card-foreground mb-4">{t('epcVsCpcTrend')}</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendData}>
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `¥${v}`} />
                    <Tooltip
                      formatter={(value: number) => `¥${value.toLocaleString()}`}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="epc" name="EPC" stroke="hsl(var(--chart-emerald))" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="cpc" name="CPC" stroke="hsl(var(--chart-rose))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-card-foreground mb-4">{t('atvTrend')}</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trendData}>
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => `¥${value.toLocaleString()}`}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="atv" name="ATV" stroke="hsl(var(--chart-indigo))" fill="hsl(var(--chart-indigo) / 0.15)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </>
      )}

      <EnterFunnelDataModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={async (data) => {
          try {
            await api.marketingFunnel.create({
              recordDate: new Date(data.recordDate).toISOString(),
              campaignLabel: data.campaignLabel,
              totalClicks: Number(data.totalClicks),
              totalRevenue: Number(data.totalRevenue),
              totalAdSpend: Number(data.totalAdSpend),
              notes: data.notes,
            });
            await queryClient.invalidateQueries({ queryKey: ['marketing-funnel'] });
            toast.success(data.recordDate + t('funnelRegistered'));
            setModalOpen(false);
          } catch (err: any) {
            toast.error(err.message || t('funnelRegistrationFailed'));
          }
        }}
      />
    </div>
  );
};

export default MarketingPage;
