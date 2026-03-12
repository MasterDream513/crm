import { useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { X, Search } from 'lucide-react';

interface AddReferralModalProps {
  open: boolean;
  onClose: () => void;
  referrerCustomerId: string;
  referrerName: string;
  onSubmit: (data: { referredCustomerId: string; referralDate: string; note: string }) => Promise<void>;
}

const AddReferralModal: React.FC<AddReferralModalProps> = ({ open, onClose, referrerCustomerId, referrerName, onSubmit }) => {
  const { t } = useLocale();
  const today = new Date().toISOString().split('T')[0];
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [referralDate, setReferralDate] = useState(today);
  const [note, setNote] = useState('');

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.customers.list({ q: search }),
    enabled: open,
  });

  // Filter out the referrer themselves
  const filteredCustomers = customers.filter((c) => c.id !== referrerCustomerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    setSubmitting(true);
    try {
      await onSubmit({ referredCustomerId: selectedCustomerId, referralDate, note });
      setSelectedCustomerId('');
      setNote('');
      setSearch('');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const selectedName = filteredCustomers.find((c) => c.id === selectedCustomerId)?.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-card border shadow-xl p-6 mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">紹介を記録</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Referrer (read-only) */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">紹介元</label>
            <div className="rounded-lg border bg-muted/50 px-3 py-2 text-sm font-medium">{referrerName}</div>
          </div>

          {/* Search and select referred customer */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">紹介先（被紹介者）</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="顧客名で検索..."
                className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {selectedName && (
              <div className="mt-1 text-xs text-primary font-medium">選択中: {selectedName}</div>
            )}
            {search && filteredCustomers.length > 0 && (
              <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border bg-background">
                {filteredCustomers.slice(0, 8).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setSelectedCustomerId(c.id); setSearch(''); }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors ${c.id === selectedCustomerId ? 'bg-primary/10 font-medium' : ''}`}
                  >
                    {c.name} {c.email && <span className="text-xs text-muted-foreground ml-1">{c.email}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date + Note */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('date')}</label>
              <input
                type="date"
                value={referralDate}
                onChange={(e) => setReferralDate(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('memo')}</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="任意メモ"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedCustomerId}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? '保存中...' : '紹介を記録'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReferralModal;
