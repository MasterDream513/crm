import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useLocale } from '@/contexts/LocaleContext';

interface NewVsRepeatChartProps {
  data: { new: number; repeat: number };
  total: number;
}

export const NewVsRepeatChart = ({ data, total }: NewVsRepeatChartProps) => {
  const { t } = useLocale();
  const chartData = [
    { name: t('newCustomers'), value: data.new },
    { name: 'リピート', value: data.repeat },
  ];
  const COLORS = ['hsl(var(--chart-indigo))', 'hsl(var(--chart-emerald))'];

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">{t('newVsRepeat')}</h3>
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-card-foreground">{total}</span>
          <span className="text-xs text-muted-foreground">合計</span>
        </div>
      </div>
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[0] }} />
          <span className="text-xs text-muted-foreground">{t('newCustomers')}: {data.new}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[1] }} />
          <span className="text-xs text-muted-foreground">リピート: {data.repeat}</span>
        </div>
      </div>
    </div>
  );
};
