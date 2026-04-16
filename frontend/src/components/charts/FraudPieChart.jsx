import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartContainer } from '@/components/charts/ChartContainer'
import { formatPercent } from '@/utils/format'

const COLORS = ['#06b6d4', '#f43f5e']

export function FraudPieChart({ fraudCases = 0, totalClaims = 0 }) {
  const safeFraud = Number(fraudCases || 0)
  const safeTotal = Number(totalClaims || 0)
  const safeNonFraud = Math.max(safeTotal - safeFraud, 0)
  const fraudRate = safeTotal > 0 ? safeFraud / safeTotal : 0

  const data = [
    { name: 'Non-Fraud', value: safeNonFraud },
    { name: 'Fraud', value: safeFraud },
  ]

  return (
    <ChartContainer
      title='Fraud Distribution'
      subtitle='Detected split between normal and suspicious claims'
      rightSlot={<span className='rounded-lg bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'>{formatPercent(fraudRate)} fraud rate</span>}
    >
      <ResponsiveContainer width='100%' height='78%'>
        <PieChart>
          <Pie data={data} dataKey='value' nameKey='name' cx='50%' cy='50%' innerRadius={62} outerRadius={92} paddingAngle={4}>
            {data.map((entry, index) => (
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
      <div className='mt-2 grid grid-cols-2 gap-2'>
        <div className='rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60'>
          <p className='text-xs text-slate-500 dark:text-slate-400'>Non-Fraud</p>
          <p className='mt-0.5 text-sm font-semibold'>{safeNonFraud}</p>
        </div>
        <div className='rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60'>
          <p className='text-xs text-slate-500 dark:text-slate-400'>Fraud</p>
          <p className='mt-0.5 text-sm font-semibold'>{safeFraud}</p>
        </div>
      </div>
    </ChartContainer>
  )
}
