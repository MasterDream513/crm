import { useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDateJa } from '@/lib/format';
import { Plus, Loader2, Calendar, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface EventItem {
  id: string;
  name: string;
  eventDate: string;
  description?: string;
  _count?: { attendees: number };
}

interface Attendee {
  id: string;
  status: 'REGISTERED' | 'ATTENDED' | 'NO_SHOW';
  customer?: { id: string; name: string };
  prospect?: { id: string; name: string };
}

const statusConfig = {
  REGISTERED: { label: '登録済', color: 'hsl(var(--chart-blue))', icon: Clock },
  ATTENDED: { label: '参加', color: 'hsl(var(--profit))', icon: CheckCircle },
  NO_SHOW: { label: 'ドタキャン', color: 'hsl(var(--loss))', icon: XCircle },
};

const EventsPage = () => {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ name: '', eventDate: today, description: '' });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.events.list() as Promise<EventItem[]>,
  });

  // Fetch attendees for selected event
  const { data: attendees = [], isLoading: attendeesLoading } = useQuery({
    queryKey: ['event-attendees', selectedEventId],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/events/${selectedEventId}/attendees`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('crm_access_token') || ''}` } }
      );
      if (!res.ok) return [];
      return res.json() as Promise<Attendee[]>;
    },
    enabled: !!selectedEventId,
  });

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setSubmitting(true);
    try {
      await api.events.create({
        name: form.name,
        eventDate: new Date(form.eventDate).toISOString(),
        description: form.description || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('イベントを作成しました');
      setForm({ name: '', eventDate: today, description: '' });
      setCreateModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (eventId: string, attendeeId: string, status: string) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/events/${eventId}/attendees/${attendeeId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('crm_access_token') || ''}`,
          },
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) throw new Error('更新に失敗しました');
      await queryClient.invalidateQueries({ queryKey: ['event-attendees', eventId] });
      toast.success('ステータスを更新しました');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '更新に失敗しました');
    }
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  // Compute attendance stats
  const attendedCount = attendees.filter((a) => a.status === 'ATTENDED').length;
  const noShowCount = attendees.filter((a) => a.status === 'NO_SHOW').length;
  const attendanceRate = attendees.length > 0 ? ((attendedCount / attendees.length) * 100).toFixed(1) : '—';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">セミナー・イベント管理</h1>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> イベント作成
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event List */}
        <div className="lg:col-span-1 space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">イベント一覧</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
              イベントがありません
            </div>
          ) : (
            events.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                className={`w-full text-left rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow ${selectedEventId === event.id ? 'ring-2 ring-primary' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">{event.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDateJa(event.eventDate)}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {event._count?.attendees ?? 0}
                  </span>
                </div>
                {event.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{event.description}</p>
                )}
              </button>
            ))
          )}
        </div>

        {/* Attendee Detail Panel */}
        <div className="lg:col-span-2">
          {!selectedEventId ? (
            <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
              左のイベントを選択して参加者を管理
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <h3 className="text-lg font-semibold">{selectedEvent?.name}</h3>
                <p className="text-xs text-muted-foreground">{selectedEvent?.eventDate && formatDateJa(selectedEvent.eventDate)}</p>
              </div>

              {/* Attendance Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border bg-card p-3 shadow-sm text-center">
                  <p className="text-xs text-muted-foreground">参加率</p>
                  <p className="text-xl font-bold text-foreground">{attendanceRate}%</p>
                </div>
                <div className="rounded-xl border bg-card p-3 shadow-sm text-center">
                  <p className="text-xs text-muted-foreground">参加</p>
                  <p className="text-xl font-bold" style={{ color: 'hsl(var(--profit))' }}>{attendedCount}</p>
                </div>
                <div className="rounded-xl border bg-card p-3 shadow-sm text-center">
                  <p className="text-xs text-muted-foreground">ドタキャン</p>
                  <p className="text-xl font-bold" style={{ color: 'hsl(var(--loss))' }}>{noShowCount}</p>
                </div>
              </div>

              {/* Attendee Table */}
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                {attendeesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : attendees.length === 0 ? (
                  <div className="px-4 py-8 text-center text-muted-foreground text-sm">参加者がいません</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('name')}</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('status')}</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendees.map((att, i) => {
                        const name = att.customer?.name || att.prospect?.name || '不明';
                        const cfg = statusConfig[att.status];
                        const Icon = cfg.icon;
                        return (
                          <tr key={att.id} className={`border-b last:border-0 hover:bg-muted/30 ${i % 2 ? 'bg-muted/20' : ''}`}>
                            <td className="px-4 py-3 font-medium">{name}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}>
                                <Icon className="h-3 w-3" />
                                {cfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {(['ATTENDED', 'NO_SHOW', 'REGISTERED'] as const).filter(s => s !== att.status).map((s) => {
                                  const sc = statusConfig[s];
                                  return (
                                    <button
                                      key={s}
                                      onClick={() => handleStatusChange(selectedEventId!, att.id, s)}
                                      className="rounded-md border px-2 py-1 text-[10px] font-medium hover:opacity-80 transition-opacity"
                                      style={{ color: sc.color, borderColor: `${sc.color}40` }}
                                    >
                                      {sc.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setCreateModalOpen(false)}>
          <div className="w-full max-w-lg rounded-xl bg-card border shadow-xl p-6 mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-5">イベント作成</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t('name')}</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例) 無料セミナー（新規集客革命セミナー）"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t('date')}</label>
                <input
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">説明</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="任意"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setCreateModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting ? '作成中...' : t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
