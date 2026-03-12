import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useLocale } from '@/contexts/LocaleContext';

interface ProductVolumeChartProps {
  data: Record<string, { productName: string; count: number; revenueJpy: number }>;
}

export const ProductVolumeChart = ({ data }: ProductVolumeChartProps) => {
  const { t } = useLocale();
  const chartData = Object.values(data).sort((a, b) => b.count - a.count);

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">{t('productVolume')}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis
            type="category"
            dataKey="productName"
            width={100}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="count" fill="hsl(var(--chart-indigo))" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
