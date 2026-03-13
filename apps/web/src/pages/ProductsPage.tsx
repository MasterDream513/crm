import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from '@/contexts/LocaleContext';
import { formatYen } from '@/lib/format';
import { api } from '@/lib/api';
import { Package, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Product, ProductCategory, BillingType } from '@/types';
import AddProductModal from '@/components/modals/AddProductModal';
import type { ProductFormData } from '@/components/modals/AddProductModal';

const ProductsPage = () => {
  const { t } = useLocale();

  const categoryLabels: Record<ProductCategory, string> = {
    LIST_ACQUISITION: t('catListAcquisition' as any),
    INDIVIDUAL: t('catIndividual' as any),
    SEMINAR: t('catSeminar' as any),
    ONLINE_COURSE: t('catOnlineCourse' as any),
    SUBSCRIPTION: t('catSubscription' as any),
  };

  const billingLabels: Record<BillingType, { label: string; color: string }> = {
    ONE_TIME: { label: t('oneTime' as any), color: 'hsl(var(--chart-indigo))' },
    RECURRING_MONTHLY: { label: t('recurringMonthly' as any), color: 'hsl(var(--chart-emerald))' },
    RECURRING_ANNUAL: { label: t('recurringAnnual' as any), color: 'hsl(var(--chart-blue))' },
  };
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const categories = Object.keys(categoryLabels) as ProductCategory[];

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.products.list(),
  });

  const handleAdd = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`「${product.name}」${t('confirmDelete' as any)}`)) return;
    try {
      await api.products.delete(product.id);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`「${product.name}」${t('productDeleted' as any)}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('deleteFailed' as any));
    }
  };

  const handleSubmit = async (data: ProductFormData) => {
    try {
      if (editingProduct) {
        await api.products.update(editingProduct.id, {
          name: data.name,
          priceJpy: Number(data.priceJpy),
          category: data.category,
          billingType: data.billingType,
          isActive: data.isActive,
        });
        toast.success(`「${data.name}」${t('productUpdated' as any)}`);
      } else {
        await api.products.create({
          name: data.name,
          priceJpy: Number(data.priceJpy),
          category: data.category,
          billingType: data.billingType,
          isActive: data.isActive,
        });
        toast.success(`「${data.name}」${t('productAdded' as any)}`);
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('saveFailed' as any));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('products')}</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          {t('addProduct')}
        </button>
      </div>

      {categories.map((cat) => {
        const items = products.filter((p) => p.category === cat);
        if (items.length === 0) return null;

        return (
          <section key={cat} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {categoryLabels[cat]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((p) => (
                <div key={p.id} className="card-hover rounded-xl border bg-card p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className={`font-semibold text-card-foreground ${!p.isActive ? 'line-through opacity-50' : ''}`}>
                          {p.name}
                        </p>
                        <p className="text-lg font-bold text-foreground mt-0.5">{formatYen(p.priceJpy)}</p>
                      </div>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                      style={{
                        backgroundColor: `${billingLabels[p.billingType].color}15`,
                        color: billingLabels[p.billingType].color,
                      }}
                    >
                      {billingLabels[p.billingType].label}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className="text-xs font-medium"
                      style={{ color: p.isActive ? 'hsl(var(--profit))' : 'hsl(var(--muted-foreground))' }}
                    >
                      {p.isActive ? t('active') : t('inactive')}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(p)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t('edit')}</button>
                      <button onClick={() => handleDelete(p)} className="text-xs text-destructive hover:opacity-80 transition-opacity">{t('delete')}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <AddProductModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingProduct(null); }}
        onSubmit={handleSubmit}
        initialData={editingProduct ? {
          name: editingProduct.name,
          priceJpy: String(editingProduct.priceJpy),
          category: editingProduct.category,
          billingType: editingProduct.billingType,
          description: '',
          isActive: editingProduct.isActive,
        } : undefined}
        title={editingProduct ? t('editProduct' as any) : undefined}
      />
    </div>
  );
};

export default ProductsPage;
