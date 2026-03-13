import { useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatYen, formatDateJa } from '@/lib/format';
import { Plus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Expense {
  id: string;
  label: string;
  amountJpy: number;
  category: string;
  expenseDate: string;
  note?: string;
}

const ExpensesPage = () => {
  const { t } = useLocale();

  const categoryOptions = [
    { value: 'AD_SPEND', label: t('catAdSpend') },
    { value: 'TOOL', label: t('catTool') },
    { value: 'OFFICE', label: t('catOffice') },
    { value: 'OUTSOURCE', label: t('catOutsource') },
    { value: 'TRAVEL', label: t('catTravel') },
    { value: 'SUPPLY', label: t('catSupply') },
    { value: 'OTHER', label: t('catOther') },
  ];

  const categoryLabel = (value: string) => categoryOptions.find((c) => c.value === value)?.label || value;
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    label: '',
    amountJpy: '',
    category: 'AD_SPEND',
    expenseDate: today,
    note: '',
  });

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.expenses.list() as Promise<Expense[]>,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label || !form.amountJpy) return;
    setSubmitting(true);
    try {
      await api.expenses.create({
        label: form.label,
        amountJpy: parseInt(form.amountJpy),
        category: form.category,
        expenseDate: new Date(form.expenseDate).toISOString(),
        note: form.note || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success(t('expenseRegistered'));
      setForm({ label: '', amountJpy: '', category: 'AD_SPEND', expenseDate: today, note: '' });
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('registrationFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDeleteExpense'))) return;
    try {
      await api.expenses.delete(id);
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success(t('expenseDeleted'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('deleteFailed'));
    }
  };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amountJpy, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('expense')}</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> {t('addExpense')}
        </button>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="text-xs text-muted-foreground mb-1">{t('expenseTotal')}</div>
        <div className="text-2xl font-bold" style={{ color: 'hsl(var(--loss))' }}>{formatYen(totalExpense)}</div>
        <div className="text-xs text-muted-foreground">{expenses.length} {t('items')}</div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">{t('loading')}</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('date')}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('category')}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('name')}</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t('amount')}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('memo')}</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp, i) => (
                  <tr key={exp.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateJa(exp.expenseDate)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                        {categoryLabel(exp.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{exp.label}</td>
                    <td className="px-4 py-3 text-right font-medium" style={{ color: 'hsl(var(--loss))' }}>{formatYen(exp.amountJpy)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{exp.note || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t('noExpenseData')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-lg rounded-xl bg-card border shadow-xl p-6 mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-5">{t('addExpense')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t('name')}</label>
                <input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder={t('placeholderExpense')}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t('amount')} (円)</label>
                  <input
                    type="number"
                    value={form.amountJpy}
                    onChange={(e) => setForm({ ...form, amountJpy: e.target.value })}
                    placeholder="50000"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    required
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t('category')}</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {categoryOptions.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t('date')}</label>
                  <input
                    type="date"
                    value={form.expenseDate}
                    onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t('memo')}</label>
                  <input
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder={t('optionalMemo')}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting ? t('saving') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
