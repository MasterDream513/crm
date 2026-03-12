import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from '@/contexts/LocaleContext';
import { api } from '@/lib/api';
import { formatYen, formatDateJa, formatRelativeDate } from '@/lib/format';
import { toast } from 'sonner';
import type { CustomerRank, FollowLogType } from '@/types';
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, TrendingUp,
  AlertTriangle, Star, Loader2, Plus, Clock, MessageSquare,
  PhoneCall, Video, FileText, MoreHorizontal, Gift,
} from 'lucide-react';
import AddFollowLogModal from '@/components/modals/AddFollowLogModal';
import AddReferralModal from '@/components/modals/AddReferralModal';

const rankConfig: Record<CustomerRank, { label: string; color: string; level: number }> = {
  RANK_1: { label: '無料会員', color: 'hsl(var(--rank-1))', level: 1 },
  RANK_2: { label: '一般客', color: 'hsl(var(--rank-2))', level: 2 },
  RANK_3: { label: '優良客', color: 'hsl(var(--rank-3))', level: 3 },
  RANK_4: { label: 'VIP予備', color: 'hsl(var(--rank-4))', level: 4 },
  RANK_5: { label: 'VIP', color: 'hsl(var(--rank-5))', level: 5 },
  RANK_6: { label: 'スーパーVIP', color: 'hsl(var(--rank-6))', level: 6 },
};

const followTypeIcon: Record<FollowLogType, React.ReactNode> = {
  CALL: <PhoneCall className="h-4 w-4" />,
  LINE: <MessageSquare className="h-4 w-4" />,
  MEETING: <Video className="h-4 w-4" />,
  EMAIL: <Mail className="h-4 w-4" />,
  LETTER: <FileText className="h-4 w-4" />,
  OTHER: <MoreHorizontal className="h-4 w-4" />,
};

const followTypeLabel: Record<FollowLogType, string> = {
  CALL: '電話',
  LINE: 'LINE',
  MEETING: '面談',
  EMAIL: 'メール',
  LETTER: '手紙',
  OTHER: 'その他',
};

const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'purchases' | 'follows'>('purchases');

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.customers.get(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-4 animate-fade-in">
        <button onClick={() => navigate('/customers')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t('customers')}
        </button>
        <div className="text-center py-16 text-muted-foreground">顧客が見つかりません</div>
      </div>
    );
  }

  const rank = rankConfig[customer.rank];
  const transactions = customer.transactions || [];
  const followLogs = customer.followLogs || [];
  const overdueFollows = followLogs.filter(
    (log) => log.nextDueDate && new Date(log.nextDueDate) < new Date()
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => navigate('/customers')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> {t('customers')}
      </button>

      {/* Header: Name + Rank + Status */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
            <span
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: `${rank.color}20`, color: rank.color }}
            >
              {customer.rank === 'RANK_6' && <Star className="h-3 w-3" />}
              {rank.label}
            </span>
            {customer.isDormant && (
              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: 'hsl(var(--loss) / 0.1)', color: 'hsl(var(--loss))' }}>
                <AlertTriangle className="h-3 w-3" /> 離脱リスク
              </span>
            )}
          </div>
          {/* Contact info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {customer.phone && (
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{customer.phone}</span>
            )}
            {customer.email && (
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{customer.email}</span>
            )}
            {customer.address && (
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{customer.address}</span>
            )}
            {customer.acquisitionSource && (
              <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" />獲得元: {customer.acquisitionSource}</span>
            )}
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setReferralModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Gift className="h-4 w-4" /> 紹介記録
          </button>
          <button
            onClick={() => setFollowModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> {t('addFollow')}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-xs text-muted-foreground mb-1">{t('cumulativeSales')}</div>
          <div className="text-xl font-bold text-foreground">{formatYen(customer.cumulativeSpend)}</div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-xs text-muted-foreground mb-1">{t('ltv')}</div>
          <div className="text-xl font-bold text-foreground">{formatYen(customer.ltvProxy)}</div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-xs text-muted-foreground mb-1">{t('maCps')}</div>
          <div className="text-xl font-bold text-foreground">{formatYen(customer.maCps)}</div>
          <div className="text-[10px] text-muted-foreground">LTV x 60%</div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-xs text-muted-foreground mb-1">{t('lastPurchase')}</div>
          <div className="text-xl font-bold text-foreground">
            {customer.lastPurchaseDate ? formatRelativeDate(customer.lastPurchaseDate) : '—'}
          </div>
          {customer.daysSinceLastPurchase != null && customer.daysSinceLastPurchase > 60 && (
            <div className="text-[10px]" style={{ color: 'hsl(var(--loss))' }}>
              {customer.daysSinceLastPurchase}日間未購入
            </div>
          )}
        </div>
      </div>

      {/* Overdue follow-up alert */}
      {overdueFollows.length > 0 && (
        <div className="rounded-xl border-l-4 bg-card p-4 shadow-sm" style={{ borderColor: 'hsl(var(--warning))' }}>
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'hsl(var(--warning))' }}>
            <Clock className="h-4 w-4" />
            期限超過のフォローアップが {overdueFollows.length} 件あります
          </div>
          <div className="mt-2 space-y-1">
            {overdueFollows.slice(0, 3).map((log) => (
              <div key={log.id} className="text-xs text-muted-foreground">
                {followTypeLabel[log.type as FollowLogType]}: {log.nextAction || '—'} (期限: {formatDateJa(log.nextDueDate!)})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === 'purchases' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          {t('purchaseHistory')} ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('follows')}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === 'follows' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          {t('followHistory')} ({followLogs.length})
        </button>
      </div>

      {/* Purchase History */}
      {activeTab === 'purchases' && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('date')}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">商品</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t('amount')}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('billingType')}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('memo')}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr key={tx.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateJa(tx.transactionDate)}</td>
                    <td className="px-4 py-3 font-medium">{tx.product?.name || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatYen(tx.amountJpy)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {tx.billingType === 'RECURRING_MONTHLY' ? '月額' : tx.billingType === 'RECURRING_ANNUAL' ? '年額' : '一括'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{tx.note || '—'}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{t('noPurchases')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Follow-up History */}
      {activeTab === 'follows' && (
        <div className="space-y-3">
          {followLogs.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground shadow-sm">
              フォロー履歴がありません
            </div>
          ) : (
            followLogs.map((log) => {
              const isOverdue = log.nextDueDate && new Date(log.nextDueDate) < new Date();
              return (
                <div key={log.id} className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-lg p-2 bg-muted">
                        {followTypeIcon[log.type as FollowLogType]}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{followTypeLabel[log.type as FollowLogType]}</span>
                          <span className="text-xs text-muted-foreground">{formatDateJa(log.logDate)}</span>
                        </div>
                        {log.notes && <p className="text-sm text-muted-foreground">{log.notes}</p>}
                        {log.outcome && (
                          <p className="text-xs text-muted-foreground">結果: {log.outcome}</p>
                        )}
                        {log.nextAction && (
                          <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'font-semibold' : 'text-muted-foreground'}`}
                            style={isOverdue ? { color: 'hsl(var(--loss))' } : undefined}>
                            <Calendar className="h-3 w-3" />
                            次回: {log.nextAction}
                            {log.nextDueDate && ` (${formatDateJa(log.nextDueDate)})`}
                            {isOverdue && ' — 期限超過'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Follow Log Modal */}
      <AddFollowLogModal
        open={followModalOpen}
        onClose={() => setFollowModalOpen(false)}
        customerId={id!}
        onSubmit={async (data) => {
          try {
            await api.followLogs.create({
              customerId: id,
              type: data.type,
              logDate: new Date(data.logDate).toISOString(),
              notes: data.notes || undefined,
              outcome: data.outcome || undefined,
              nextAction: data.nextAction || undefined,
              nextDueDate: data.nextDueDate ? new Date(data.nextDueDate).toISOString() : undefined,
            });
            await queryClient.invalidateQueries({ queryKey: ['customer', id] });
            toast.success('フォローログを追加しました');
            setFollowModalOpen(false);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : '追加に失敗しました');
          }
        }}
      />

      {/* Referral Modal */}
      <AddReferralModal
        open={referralModalOpen}
        onClose={() => setReferralModalOpen(false)}
        referrerCustomerId={id!}
        referrerName={customer.name}
        onSubmit={async (data) => {
          try {
            await api.referrals.create({
              referrerCustomerId: id,
              referredCustomerId: data.referredCustomerId,
              referralDate: new Date(data.referralDate).toISOString(),
              note: data.note || undefined,
            });
            await queryClient.invalidateQueries({ queryKey: ['customer', id] });
            toast.success('紹介を記録しました');
            setReferralModalOpen(false);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : '記録に失敗しました');
          }
        }}
      />
    </div>
  );
};

export default CustomerDetailPage;
