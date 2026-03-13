import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from '@/contexts/LocaleContext';
import { formatYen } from '@/lib/format';
import { api } from '@/lib/api';
import { Receipt } from 'lucide-react';
import { toast } from 'sonner';

const SalesPage = () => {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'product' | 'direct'>('product');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Form state
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [amountJpy, setAmountJpy] = useState('');
  const [billingType, setBillingType] = useState('ONE_TIME');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 16));
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Queries
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.customers.list(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.products.list(),
  });

  const { data: summary } = useQuery({
    queryKey: ['transactions-summary', period],
    queryFn: () => api.transactions.summary(period),
  });

  // Derive top products from summary
  const topProducts = summary
    ? Object.values(summary.productVolume)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
    : [];

  const totalRevenue = summary?.revenueJpy ?? 0;
  const transactionCount = summary?.transactionCount ?? 0;

  // Selected product for showing price
  const selectedProduct = products.find((p) => p.id === productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast.error(t('selectCustomer' as any));
      return;
    }
    if (mode === 'product' && !productId) {
      toast.error(t('selectProduct' as any));
      return;
    }
    if (mode === 'direct' && (!amountJpy || Number(amountJpy) <= 0)) {
      toast.error(t('enterAmount' as any));
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        customerId,
        amountJpy: mode === 'product' && selectedProduct ? selectedProduct.priceJpy : Number(amountJpy),
        billingType: mode === 'product' && selectedProduct ? selectedProduct.billingType : billingType,
        transactionDate: new Date(transactionDate).toISOString(),
        note: note || undefined,
      };
      if (mode === 'product' && productId) {
        payload.productId = productId;
      }
      await api.transactions.create(payload);
      toast.success(t('saleRegistered' as any));
      queryClient.invalidateQueries({ queryKey: ['transactions-summary'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      // Reset form
      setProductId('');
      setAmountJpy('');
      setNote('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('registrationFailed' as any);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">{t('salesEntry')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            {t('salesEntry')}
          </h2>

          {/* Mode toggle */}
          <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
            <button
              onClick={() => setMode('product')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${mode === 'product' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
            >
              {t('fromProduct')}
            </button>
            <button
              onClick={() => setMode('direct')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${mode === 'direct' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
            >
              {t('directInput')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('customers')}</label>
              <select
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">{t('select' as any)}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {mode === 'product' ? (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('products')}</label>
                <select
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                >
                  <option value="">{t('select' as any)}</option>
                  {products.filter((p) => p.isActive).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatYen(p.priceJpy)}
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('priceLabel' as any)}: {formatYen(selectedProduct.priceJpy)} ({selectedProduct.billingType})
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('amount')}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">¥</span>
                  <input
                    type="number"
                    className="w-full rounded-lg border bg-background pl-7 pr-3 py-2.5 text-sm"
                    placeholder="0"
                    value={amountJpy}
                    onChange={(e) => setAmountJpy(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('date')}</label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('memo')}</label>
              <textarea
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm resize-none"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? t('registering' as any) : t('registerSale')}
            </button>
          </form>
        </div>

        {/* Right: Summary */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-semibold text-card-foreground">{t('salesSummary')}</h2>

          <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
            {(['daily', 'weekly', 'monthly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${period === p ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
              >
                {p === 'daily' ? t('today') : p === 'weekly' ? t('thisWeek') : t('thisMonth')}
              </button>
            ))}
          </div>

          <div className="text-center py-4">
            <p className="text-3xl font-bold" style={{ color: 'hsl(var(--profit))' }}>
              {formatYen(totalRevenue)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{transactionCount} 件</p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground">Top 5 {t('products')}</p>
            {topProducts.map((p, i) => {
              const maxRev = topProducts[0]?.revenue ?? 1;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground">{p.name}</span>
                    <span className="font-medium">{formatYen(p.revenue)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(p.revenue / maxRev) * 100}%`, backgroundColor: 'hsl(var(--chart-indigo))' }}
                    />
                  </div>
                </div>
              );
            })}
            {topProducts.length === 0 && (
              <p className="text-xs text-muted-foreground">{t('noData' as any)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesPage;
