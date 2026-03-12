import { useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { X, UserPlus, Phone, Mail, MapPin, Tag } from 'lucide-react';
import type { CustomerRank } from '@/types';

interface NewCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => void;
}

export interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  acquisitionSource: string;
  rank: CustomerRank;
  notes: string;
}

const sourceOptions = ['Web', 'セミナー', '紹介', 'Meta広告', 'LINE', 'Google広告', 'YouTube', 'その他'];

const rankOptions: { value: CustomerRank; label: string }[] = [
  { value: 'RANK_1', label: '無料会員' },
  { value: 'RANK_2', label: '一般客' },
  { value: 'RANK_3', label: '優良客' },
  { value: 'RANK_4', label: 'VIP予備' },
  { value: 'RANK_5', label: 'VIP' },
  { value: 'RANK_6', label: 'スーパーVIP' },
];

const NewCustomerModal = ({ open, onClose, onSubmit }: NewCustomerModalProps) => {
  const { t } = useLocale();
  const [form, setForm] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    acquisitionSource: '',
    rank: 'RANK_1',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({});

  if (!open) return null;

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = '名前は必須です';
    else if (form.name.length > 100) e.name = '100文字以内で入力してください';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = '有効なメールアドレスを入力してください';
    if (form.phone && !/^[\d\-+() ]{0,20}$/.test(form.phone)) e.phone = '有効な電話番号を入力してください';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    onSubmit(form);
    setForm({ name: '', email: '', phone: '', address: '', acquisitionSource: '', rank: 'RANK_1', notes: '' });
    setErrors({});
    onClose();
  };

  const set = (key: keyof CustomerFormData, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 rounded-2xl border bg-card shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <UserPlus className="h-4.5 w-4.5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">{t('newCustomer')}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name — required */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{t('name')} <span className="text-destructive">*</span></label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="山田太郎"
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />{t('email')}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="example@mail.com"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />{t('phone')}
              </label>
              <input
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="090-1234-5678"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />{t('address')}
            </label>
            <input
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="東京都渋谷区..."
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
          </div>

          {/* Source + Rank */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />{t('source')}
              </label>
              <select
                value={form.acquisitionSource}
                onChange={(e) => set('acquisitionSource', e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">選択してください</option>
                {sourceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{t('rank')}</label>
              <select
                value={form.rank}
                onChange={(e) => set('rank', e.target.value as CustomerRank)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {rankOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{t('notes')}</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="備考を入力..."
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-shadow"
            />
            <p className="text-xs text-muted-foreground text-right">{form.notes.length}/500</p>
          </div>

          {/* Actions */}
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

export default NewCustomerModal;
