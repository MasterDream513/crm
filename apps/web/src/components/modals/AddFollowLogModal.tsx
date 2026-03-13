import { useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { X } from 'lucide-react';
import type { FollowLogType } from '@/types';

interface FollowLogFormData {
  type: FollowLogType;
  logDate: string;
  notes: string;
  outcome: string;
  nextAction: string;
  nextDueDate: string;
}

interface AddFollowLogModalProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  onSubmit: (data: FollowLogFormData) => Promise<void>;
}

const AddFollowLogModal: React.FC<AddFollowLogModalProps> = ({ open, onClose, onSubmit }) => {
  const { t } = useLocale();

  const followTypes: { value: FollowLogType; label: string }[] = [
    { value: 'CALL', label: t('call') },
    { value: 'LINE', label: t('line') },
    { value: 'MEETING', label: t('meeting') },
    { value: 'EMAIL', label: t('email') },
    { value: 'LETTER', label: t('letter') },
    { value: 'OTHER', label: t('other') },
  ];
  const today = new Date().toISOString().split('T')[0];
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FollowLogFormData>({
    type: 'CALL',
    logDate: today,
    notes: '',
    outcome: '',
    nextAction: '',
    nextDueDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
      setForm({ type: 'CALL', logDate: today, notes: '', outcome: '', nextAction: '', nextDueDate: '' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-card border shadow-xl p-6 mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{t('addFollow')}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type + Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('type')}</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as FollowLogType })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {followTypes.map((ft) => (
                  <option key={ft.value} value={ft.value}>{ft.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('date')}</label>
              <input
                type="date"
                value={form.logDate}
                onChange={(e) => setForm({ ...form, logDate: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t('notes')}</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder={t('recordContent')}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Outcome */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t('outcome')}</label>
            <input
              value={form.outcome}
              onChange={(e) => setForm({ ...form, outcome: e.target.value })}
              placeholder={t('outcomeExample')}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Next Action + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('nextAction')}</label>
              <input
                value={form.nextAction}
                onChange={(e) => setForm({ ...form, nextAction: e.target.value })}
                placeholder={t('nextActionExample')}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('nextDueDate')}</label>
              <input
                type="date"
                value={form.nextDueDate}
                onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })}
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
              disabled={submitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFollowLogModal;
