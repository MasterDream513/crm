import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useLocale } from '@/contexts/LocaleContext';

interface RevenueExpenseChartProps {
  revenue: number;
  expense: number;
}

export const RevenueExpenseChart = ({ revenue, expense }: RevenueExpenseChartProps) => {
  const { t } = useLocale();
  const data = [{ name: t('monthlyBalance'), revenue, expense }];

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">{t('revenueVsExpense')}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`} />
          <Tooltip
            formatter={(value: number) => `¥${value.toLocaleString()}`}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="revenue" name={t('revenue')} fill="hsl(var(--chart-indigo))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name={t('expense')} fill="hsl(var(--chart-rose))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
