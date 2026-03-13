import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/contexts/LocaleContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatYen, formatRelativeDate } from '@/lib/format';
import { Search, Users, UserPlus, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import type { CustomerRank, ProspectStage } from '@/types';
import NewCustomerModal from '@/components/modals/NewCustomerModal';
import NewProspectModal from '@/components/modals/NewProspectModal';

const getRankConfig = (t: (key: string) => string): Record<CustomerRank, { label: string; color: string }> => ({
  RANK_1: { label: t('rank1'), color: 'hsl(var(--rank-1))' },
  RANK_2: { label: t('rank2'), color: 'hsl(var(--rank-2))' },
  RANK_3: { label: t('rank3'), color: 'hsl(var(--rank-3))' },
  RANK_4: { label: t('rank4'), color: 'hsl(var(--rank-4))' },
  RANK_5: { label: t('rank5'), color: 'hsl(var(--rank-5))' },
  RANK_6: { label: t('rank6'), color: 'hsl(var(--rank-6))' },
});

const getStageConfig = (t: (key: string) => string): Record<ProspectStage, { label: string; color: string }> => ({
  LEAD: { label: t('stageLead'), color: 'hsl(var(--rank-1))' },
  SEMINAR: { label: t('stageSeminar'), color: 'hsl(var(--rank-2))' },
  NEGOTIATION: { label: t('stageNegotiation'), color: 'hsl(var(--warning))' },
  CLOSED_WON: { label: t('stageClosedWon'), color: 'hsl(var(--profit))' },
  CLOSED_LOST: { label: t('stageClosedLost'), color: 'hsl(var(--loss))' },
});

const CustomersPage = () => {
  const { t } = useLocale();
  const rankConfig = getRankConfig(t as any);
  const stageConfig = getStageConfig(t as any);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'customers' | 'prospects'>('customers');
  const [search, setSearch] = useState('');
  const [rankFilter, setRankFilter] = useState('');
  const [dormantOnly, setDormantOnly] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [prospectModalOpen, setProspectModalOpen] = useState(false);
  const [editingProspectId, setEditingProspectId] = useState<string | null>(null);
  const [editStage, setEditStage] = useState<ProspectStage>('LEAD');

  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers', search, rankFilter, dormantOnly],
    queryFn: () => api.customers.list({ q: search, rank: rankFilter, dormant: dormantOnly ? 'true' : '' }),
  });

  const { data: prospects = [], isLoading: isLoadingProspects } = useQuery({
    queryKey: ['prospects'],
    queryFn: () => api.prospects.list(),
    enabled: tab === 'prospects',
  });

  const handleAddClick = () => {
    if (tab === 'customers') setCustomerModalOpen(true);
    else setProspectModalOpen(true);
  };

  const handleConvertToCustomer = async (prospectId: string, prospectName: string) => {
    try {
      await api.prospects.convert(prospectId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customers'] }),
        queryClient.invalidateQueries({ queryKey: ['prospects'] }),
      ]);
      toast.success(`「${prospectName}」${t('convertedToCustomer')}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('conversionFailed'));
    }
  };

  const handleUpdateProspectStage = async (prospectId: string) => {
    try {
      await api.prospects.update(prospectId, { stage: editStage });
      await queryClient.invalidateQueries({ queryKey: ['prospects'] });
      toast.success(t('stageUpdated'));
      setEditingProspectId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('updateFailed'));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('customers')}</h1>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <UserPlus className="h-4 w-4" />
          {tab === 'customers' ? t('newCustomer') : t('newProspect')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        <button
          onClick={() => setTab('customers')}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === 'customers' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          <Users className="h-3.5 w-3.5 inline mr-1.5" />
          {t('customers')}
        </button>
        <button
          onClick={() => setTab('prospects')}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === 'prospects' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          {t('prospects')}
        </button>
      </div>

      {tab === 'customers' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('search')}
                className="w-full rounded-lg border bg-card pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <select
              value={rankFilter}
              onChange={(e) => setRankFilter(e.target.value)}
              className="rounded-lg border bg-card px-3 py-2 text-sm"
            >
              <option value="">{t('allRanks')}</option>
              {Object.entries(rankConfig).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={dormantOnly}
                onChange={(e) => setDormantOnly(e.target.checked)}
                className="rounded"
              />
              {t('dormantOnly')}
            </label>
          </div>

          {/* Table */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {isLoadingCustomers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">{t('loading')}</span>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('customerName')}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('rank')}</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t('cumulativeSales')}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('lastPurchase')}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('status')}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('source')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c, i) => (
                      <tr key={c.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                        <td className="px-4 py-3">
                          <div>
                            <span
                              onClick={() => navigate(`/customers/${c.id}`)}
                              className="font-medium text-foreground cursor-pointer hover:text-primary hover:underline transition-colors"
                            >{c.name}</span>
                            {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{ backgroundColor: `${rankConfig[c.rank].color}20`, color: rankConfig[c.rank].color }}
                          >
                            {c.rank === 'RANK_6' && '⭐ '}
                            {rankConfig[c.rank].label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{formatYen(c.cumulativeSpend)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {c.lastPurchaseDate ? formatRelativeDate(c.lastPurchaseDate) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {c.isDormant ? (
                            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: 'hsl(var(--loss) / 0.1)', color: 'hsl(var(--loss))' }}>
                              {t('dormant')}
                            </span>
                          ) : (
                            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: 'hsl(var(--profit) / 0.1)', color: 'hsl(var(--profit))' }}>
                              {t('active')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{c.acquisitionSource || '—'}</td>
                      </tr>
                    ))}
                    {customers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t('noData')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'prospects' && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {isLoadingProspects ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">{t('loading')}</span>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('name')}</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('stage')}</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('source')}</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('registrationDate')}</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {prospects.map((p, i) => (
                    <tr key={p.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium text-foreground">{p.name}</span>
                          {p.email && <p className="text-xs text-muted-foreground">{p.email}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {editingProspectId === p.id ? (
                          <select
                            value={editStage}
                            onChange={(e) => setEditStage(e.target.value as ProspectStage)}
                            className="rounded-lg border bg-background px-2 py-1 text-xs"
                          >
                            {Object.entries(stageConfig).map(([key, { label }]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{ backgroundColor: `${stageConfig[p.stage].color}20`, color: stageConfig[p.stage].color }}
                          >
                            {stageConfig[p.stage].label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.acquisitionSource || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatRelativeDate(p.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {editingProspectId === p.id ? (
                            <>
                              <button
                                onClick={() => handleUpdateProspectStage(p.id)}
                                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                              >
                                {t('save')}
                              </button>
                              <button
                                onClick={() => setEditingProspectId(null)}
                                className="rounded-md border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                              >
                                {t('cancel')}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => { setEditingProspectId(p.id); setEditStage(p.stage); }}
                                className="rounded-md border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                                title={t('edit')}
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleConvertToCustomer(p.id, p.name)}
                                className="rounded-md border px-3 py-1 text-xs font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                              >
                                {t('convertToCustomer')}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {prospects.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{t('noData')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <NewCustomerModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSubmit={async (data) => {
          try {
            await api.customers.create(data);
            await queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success(`「${data.name}」${t('customerRegistered')}`);
            setCustomerModalOpen(false);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : t('registrationFailed'));
          }
        }}
      />
      <NewProspectModal
        open={prospectModalOpen}
        onClose={() => setProspectModalOpen(false)}
        onSubmit={async (data) => {
          try {
            await api.prospects.create({
              name: data.name,
              phone: data.phone,
              email: data.email,
              acquisitionSource: data.source,
              stage: data.stage,
              notes: data.notes,
            });
            await queryClient.invalidateQueries({ queryKey: ['prospects'] });
            toast.success(`「${data.name}」${t('prospectRegistered')}`);
            setProspectModalOpen(false);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : t('registrationFailed'));
          }
        }}
      />
    </div>
  );
};

export default CustomersPage;
