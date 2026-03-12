import { useState, useEffect } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { X, Package } from 'lucide-react';
import type { ProductCategory, BillingType } from '@/types';

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => void;
  initialData?: Partial<ProductFormData>;
  title?: string;
}

export interface ProductFormData {
  name: string;
  priceJpy: string;
  category: ProductCategory;
  billingType: BillingType;
  description: string;
  isActive: boolean;
}

const categoryOptions: { value: ProductCategory; label: string }[] = [
  { value: 'LIST_ACQUISITION', label: 'リスト獲得' },
  { value: 'INDIVIDUAL', label: '個別' },
  { value: 'SEMINAR', label: 'セミナー' },
  { value: 'ONLINE_COURSE', label: 'オンライン講座' },
  { value: 'SUBSCRIPTION', label: 'サブスクリプション' },
];

const billingOptions: { value: BillingType; label: string }[] = [
  { value: 'ONE_TIME', label: '一括' },
  { value: 'RECURRING_MONTHLY', label: '月額' },
  { value: 'RECURRING_ANNUAL', label: '年額' },
];

const defaultForm: ProductFormData = {
  name: '',
  priceJpy: '',
  category: 'INDIVIDUAL',
  billingType: 'ONE_TIME',
  description: '',
  isActive: true,
};

const AddProductModal = ({ open, onClose, onSubmit, initialData, title }: AddProductModalProps) => {
  const { t } = useLocale();
  const [form, setForm] = useState<ProductFormData>({ ...defaultForm, ...initialData });
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});

  useEffect(() => {
    if (open) {
      setForm({ ...defaultForm, ...initialData });
      setErrors({});
    }
  }, [open, initialData]);

  if (!open) return null;

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = '商品名は必須です';
    else if (form.name.length > 100) e.name = '100文字以内で入力してください';
    if (!form.priceJpy) e.priceJpy = '価格は必須です';
    else if (isNaN(Number(form.priceJpy)) || Number(form.priceJpy) < 0) e.priceJpy = '有効な金額を入力してください';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    onSubmit(form);
    setForm({ name: '', priceJpy: '', category: 'INDIVIDUAL', billingType: 'ONE_TIME', description: '', isActive: true });
    setErrors({});
    onClose();
  };

  const set = (key: keyof ProductFormData, value: string | boolean) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key as keyof typeof errors]) setErrors((p) => ({ ...p, [key]: undefined }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 rounded-2xl border bg-card shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-4.5 w-4.5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">{title || t('addProduct')}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Product Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{t('name')} <span className="text-destructive">*</span></label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="商品名を入力"
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Price + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{t('price')} <span className="text-destructive">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">¥</span>
                <input
                  type="number"
                  min="0"
                  value={form.priceJpy}
                  onChange={(e) => set('priceJpy', e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border bg-background pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                />
              </div>
              {errors.priceJpy && <p className="text-xs text-destructive">{errors.priceJpy}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{t('category')}</label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {categoryOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Billing Type */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{t('billingType')}</label>
            <div className="flex gap-2">
              {billingOptions.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => set('billingType', b.value)}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                    form.billingType === b.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">説明</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="商品の説明を入力..."
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-shadow"
            />
            <p className="text-xs text-muted-foreground text-right">{form.description.length}/500</p>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">{t('active')}</p>
              <p className="text-xs text-muted-foreground">商品を公開状態にする</p>
            </div>
            <button
              type="button"
              onClick={() => set('isActive', !form.isActive)}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.isActive ? 'bg-primary' : 'bg-muted-foreground/30'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-5' : ''}`} />
            </button>
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

export default AddProductModal;
