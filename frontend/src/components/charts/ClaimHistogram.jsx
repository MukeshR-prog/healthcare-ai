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
    <ChartContainer title='Claim Amount Histogram'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart data={buckets}>
            <XAxis dataKey='range' />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey='value' fill='#0284c7' radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
    </ChartContainer>
  )
}
