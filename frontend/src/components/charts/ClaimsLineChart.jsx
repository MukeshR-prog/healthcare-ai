import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartContainer } from '@/components/charts/ChartContainer'
import { formatCurrency } from '@/utils/format'

export function ClaimsLineChart({ data = [] }) {
  return (
    <ChartContainer title='Claim Amount Trend' subtitle='Last processed claims over time'>
      <ResponsiveContainer width='100%' height='100%'>
        <AreaChart data={data} margin={{ top: 8, right: 10, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id='claimsArea' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#0ea5e9' stopOpacity={0.38} />
              <stop offset='95%' stopColor='#0ea5e9' stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray='4 4' stroke='#cbd5e1' opacity={0.5} />
          <XAxis dataKey='date' tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} minTickGap={22} />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickFormatter={(value) => formatCurrency(value).replace('.00', '')}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #cbd5e1',
              boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)',
            }}
            formatter={(value) => formatCurrency(Number(value || 0))}
          />
          <Area type='monotone' dataKey='amount' stroke='#0ea5e9' strokeWidth={2.5} fill='url(#claimsArea)' />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
