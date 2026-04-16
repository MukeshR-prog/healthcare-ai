import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartContainer } from '@/components/charts/ChartContainer'

export function ClaimHistogram({ rows = [] }) {
  const buckets = [
    { range: '0-499', min: 0, max: 499, value: 0 },
    { range: '500-999', min: 500, max: 999, value: 0 },
    { range: '1000-1499', min: 1000, max: 1499, value: 0 },
    { range: '1500+', min: 1500, max: Infinity, value: 0 },
  ]

  rows.forEach((row) => {
    const amount = Number(row.amount || row.ClaimAmount || 0)
    const bucket = buckets.find((b) => amount >= b.min && amount <= b.max)
    if (bucket) bucket.value += 1
  })

  return (
    <ChartContainer title='Claim Amount Histogram' subtitle='Claim volume distributed across amount bands'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart data={buckets} margin={{ top: 8, right: 10, left: -14, bottom: 0 }}>
          <XAxis dataKey='range' tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #cbd5e1',
              boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)',
            }}
            formatter={(value) => `${Number(value || 0)} claims`}
          />
          <Bar dataKey='value' fill='#0284c7' radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
