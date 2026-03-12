import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  detail?: string;
  borderColor?: string;
  tooltip?: string;
  badge?: { label: string; variant: 'profit' | 'loss' | 'warning' | 'info' };
  icon?: React.ReactNode;
}

export const KpiCard = ({ title, value, detail, borderColor, tooltip, badge, icon }: KpiCardProps) => {
  return (
    <div
      className="card-hover rounded-xl border bg-card p-4 shadow-sm"
      style={{ borderLeftWidth: '3px', borderLeftColor: borderColor || 'hsl(var(--border))' }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <p className="text-2xl font-bold text-card-foreground">{value}</p>
          {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
        </div>
        <div className="flex flex-col items-end gap-1">
          {icon}
          {badge && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{
                backgroundColor: `hsl(var(--${badge.variant}) / 0.12)`,
                color: `hsl(var(--${badge.variant}))`,
              }}
            >
              {badge.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
