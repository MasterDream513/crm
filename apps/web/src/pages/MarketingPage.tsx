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
      label: 'CPC > EPC',
      status: latest.cpc > latest.epc ? 'danger' : 'ok',
      diagnosis: latest.cpc > latest.epc ? '広告クリエイティブまたはターゲティングを見直す' : 'クリックあたり利益が出ています',
      icon: latest.cpc > latest.epc ? AlertTriangle : CheckCircle,
    },
    {
      label: 'CPA > MA-CPS',
      status: latest.cpa > latest.maCps ? 'danger' : 'ok',
      diagnosis: latest.cpa > latest.maCps ? 'ファネル全体のCVRを改善する' : '顧客獲得コストは許容範囲内',
      icon: latest.cpa > latest.maCps ? AlertTriangle : CheckCircle,
    },
    {
      label: 'ATV 低下',
      status: 'ok',
      diagnosis: 'アップセル/クロスセルを強化する',
      icon: AlertCircle,
    },
    {
      label: 'LTV 高い + CPC 赤字',
      status: isProfitable ? 'na' : 'info',
      diagnosis: 'リストの質は高い。短期赤字は許容可能',
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
          <p className="text-lg font-semibold text-card-foreground">No data yet</p>
          <p className="text-sm text-muted-foreground">
            ファネルデータを登録すると、マーケティング分析が表示されます。
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
              <KpiCard title={t('cpa')} value={formatYen(latest.cpa)} borderColor="hsl(var(--chart-indigo))" tooltip="広告費 ÷ 新規顧客数" />
              <KpiCard title={t('cps')} value={formatYen(latest.cpa)} borderColor="hsl(var(--chart-blue))" tooltip="広告費 ÷ 販売件数" />
              <KpiCard title={t('epc')} value={formatYen(latest.epc)} borderColor="hsl(var(--chart-emerald))" tooltip="売上 ÷ クリック数" />
              <KpiCard title={t('cpc')} value={formatYen(latest.cpc)} borderColor="hsl(var(--chart-rose))" tooltip="広告費 ÷ クリック数" />
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
                    ? `✅ 広告は黒字 — クリックあたり ¥${(latest.epc - latest.cpc).toLocaleString()} の利益`
                    : `⚠️ 広告は赤字 — クリックあたり ¥${(latest.cpc - latest.epc).toLocaleString()} の損失`
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
                  {isCpaSafe ? '✅ 顧客獲得コストは許容範囲内' : '⚠️ 顧客獲得コストがLTVベースの上限を超えています'}
                </div>
              </div>

              {/* ATV */}
              <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
                <p className="text-xs text-muted-foreground">{t('atv')}</p>
                <p className="text-3xl font-bold text-foreground">{formatYen(latest.atv)}</p>
                <p className="text-xs text-muted-foreground">ClickFunnels equivalent — セールスファネルの効率指標</p>
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
                <h3 className="text-sm font-semibold text-card-foreground mb-4">EPC vs CPC 推移</h3>
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
                <h3 className="text-sm font-semibold text-card-foreground mb-4">ATV 推移</h3>
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
            toast.success(`${data.recordDate} のファネルデータを登録しました`);
            setModalOpen(false);
          } catch (err: any) {
            toast.error(err.message || 'ファネルデータの登録に失敗しました');
          }
        }}
      />
    </div>
  );
};

export default MarketingPage;
