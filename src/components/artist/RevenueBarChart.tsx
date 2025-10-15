'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type ChartDatum = {
  label: string;
  value: number;
};

type RevenueBarChartProps = {
  title?: string;
  data: ChartDatum[];
  color?: string;
};

export default function RevenueBarChart({
  title = '매출 추이',
  data,
  color = 'var(--color-primary)',
}: RevenueBarChartProps) {
  return (
    <section className="rounded-2xl bg-white p-6 border border-gray-200">
      <h4 className="mb-4 text-lg font-semibold text-gray-900">{title}</h4>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="label" tick={{ fill: '#666', fontSize: 12 }} />
            <YAxis
              tickFormatter={(v) => v.toLocaleString()}
              tick={{ fill: '#666', fontSize: 12 }}
            />
            <Tooltip
              formatter={(v: number) => [`₩ ${v.toLocaleString()}`, '매출']}
              labelStyle={{ color: '#666' }}
              itemStyle={{ color }}
            />
            <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
