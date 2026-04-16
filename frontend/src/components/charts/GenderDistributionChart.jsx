import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartContainer } from '@/components/charts/ChartContainer'

const COLORS = ['#0284c7', '#f97316', '#8b5cf6', '#14b8a6']

export function GenderDistributionChart({ data = [] }) {
  const normalized = data.map((item) => ({
    name: item.gender || 'Unknown',
    value: Number(item.count || 0),
  }))

  return (
    <ChartContainer title='Gender Distribution' subtitle='Demographic mix of the current claim set'>
      <ResponsiveContainer width='100%' height='78%'>
        <PieChart>
          <Pie data={normalized} dataKey='value' nameKey='name' cx='50%' cy='50%' innerRadius={58} outerRadius={90} paddingAngle={3}>
            {normalized.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #cbd5e1',
              boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className='mt-2 flex flex-wrap gap-2'>
        {normalized.map((item, index) => (
          <span
            key={item.name}
            className='inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300'
          >
            <span className='h-2 w-2 rounded-full' style={{ backgroundColor: COLORS[index % COLORS.length] }} />
            {item.name}: {item.value}
          </span>
        ))}
      </div>
    </ChartContainer>
  )
}
