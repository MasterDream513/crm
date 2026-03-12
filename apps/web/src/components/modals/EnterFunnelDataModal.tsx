import { useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { X, BarChart3 } from 'lucide-react';

interface EnterFunnelDataModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FunnelFormData) => void;
}

export interface FunnelFormData {
  recordDate: string;
  campaignLabel: string;
  totalClicks: string;
  totalRevenue: string;
  totalAdSpend: string;
  newCustomers: string;
  salesCount: string;
  notes: string;
}

const EnterFunnelDataModal = ({ open, onClose, onSubmit }: EnterFunnelDataModalProps) => {
  const { t } = useLocale();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<FunnelFormData>({
    recordDate: today,
    campaignLabel: '',
    totalClicks: '',
    totalRevenue: '',
    totalAdSpend: '',
    newCustomers: '',
    salesCount: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FunnelFormData, string>>>({});

  if (!open) return null;

  const numOrZero = (v: string) => (v === '' ? 0 : Number(v));
  const clicks = numOrZero(form.totalClicks);
  const revenue = numOrZero(form.totalRevenue);
  const adSpend = numOrZero(form.totalAdSpend);
  const newCust = numOrZero(form.newCustomers);
  const sales = numOrZero(form.salesCount);

  const epc = clicks > 0 ? Math.round(revenue / clicks) : 0;
  const cpc = clicks > 0 ? Math.round(adSpend / clicks) : 0;
  const cpa = newCust > 0 ? Math.round(adSpend / newCust) : 0;
  const cps = sales > 0 ? Math.round(adSpend / sales) : 0;
  const atv = sales > 0 ? Math.round(revenue / sales) : 0;

  const validate = () => {
    const e: typeof errors = {};
    if (!form.recordDate) e.recordDate = '日付は必須です';
    if (!form.totalClicks || Number(form.totalClicks) < 0) e.totalClicks = '有効な数値を入力してください';
    if (!form.totalRevenue || Number(form.totalRevenue) < 0) e.totalRevenue = '有効な金額を入力してください';
    if (!form.totalAdSpend || Number(form.totalAdSpend) < 0) e.totalAdSpend = '有効な金額を入力してください';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    onSubmit(form);
    setForm({ recordDate: today, campaignLabel: '', totalClicks: '', totalRevenue: '', totalAdSpend: '', newCustomers: '', salesCount: '', notes: '' });
    setErrors({});
    onClose();
  };

  const set = (key: keyof FunnelFormData, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const metricCard = (label: string, value: number, color: string) => (
    <div className="rounded-lg border p-3 text-center">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold mt-0.5" style={{ color }}>¥{value.toLocaleString()}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 rounded-2xl border bg-card shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-4.5 w-4.5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">{t('enterFunnelData')}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Date + Campaign */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{t('date')} <span className="text-destructive">*</span></label>
              <input
                type="date"
                value={form.recordDate}
                onChange={(e) => set('recordDate', e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
              />
              {errors.recordDate && <p className="text-xs text-destructive">{errors.recordDate}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">キャンペーン名</label>
              <input
                value={form.campaignLabel}
                onChange={(e) => set('campaignLabel', e.target.value)}
                placeholder="例: Meta春キャンペーン"
                maxLength={100}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
              />
            </div>
          </div>

          {/* Raw metrics */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">生データ入力</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">総クリック数 <span className="text-destructive">*</span></label>
                <input
                  type="number"
                  min="0"
                  value={form.totalClicks}
                  onChange={(e) => set('totalClicks', e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                />
                {errors.totalClicks && <p className="text-xs text-destructive">{errors.totalClicks}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">総売上 (¥) <span className="text-destructive">*</span></label>
                <input
                  type="number"
                  min="0"
                  value={form.totalRevenue}
                  onChange={(e) => set('totalRevenue', e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                />
                {errors.totalRevenue && <p className="text-xs text-destructive">{errors.totalRevenue}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">総広告費 (¥) <span className="text-destructive">*</span></label>
                <input
                  type="number"
                  min="0"
                  value={form.totalAdSpend}
                  onChange={(e) => set('totalAdSpend', e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                />
                {errors.totalAdSpend && <p className="text-xs text-destructive">{errors.totalAdSpend}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">新規顧客数</label>
                <input
                  type="number"
                  min="0"
                  value={form.newCustomers}
                  onChange={(e) => set('newCustomers', e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">販売件数</label>
                <input
                  type="number"
                  min="0"
                  value={form.salesCount}
                  onChange={(e) => set('salesCount', e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                />
              </div>
            </div>
          </div>

          {/* Auto-calculated metrics */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">自動計算指標</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {metricCard('EPC', epc, 'hsl(var(--chart-emerald))')}
              {metricCard('CPC', cpc, 'hsl(var(--chart-rose))')}
              {metricCard('CPA', cpa, 'hsl(var(--chart-indigo))')}
              {metricCard('CPS', cps, 'hsl(var(--chart-blue))')}
              {metricCard('ATV', atv, 'hsl(var(--chart-amber))')}
            </div>
            {clicks > 0 && (
              <div
                className="rounded-lg p-2.5 text-center text-xs font-medium"
                style={{
                  backgroundColor: epc > cpc ? 'hsl(var(--profit) / 0.1)' : 'hsl(var(--loss) / 0.1)',
                  color: epc > cpc ? 'hsl(var(--profit))' : 'hsl(var(--loss))',
                }}
              >
                {epc > cpc
                  ? `✅ 広告は黒字 — クリックあたり ¥${(epc - cpc).toLocaleString()} の利益`
                  : `⚠️ 広告は赤字 — クリックあたり ¥${(cpc - epc).toLocaleString()} の損失`
                }
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{t('notes')}</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="メモを入力..."
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-shadow"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
              {t('cancel')}
            </button>
            <button type="submit" className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnterFunnelDataModal;
