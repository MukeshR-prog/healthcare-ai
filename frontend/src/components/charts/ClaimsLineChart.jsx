import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartContainer } from '@/components/charts/ChartContainer'

export function ClaimsLineChart({ data = [] }) {
  return (
    <ChartContainer title='Claim Amount Trend'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray='3 3' stroke='#cbd5e1' />
            <XAxis dataKey='date' />
            <YAxis />
            <Tooltip />
            <Line type='monotone' dataKey='amount' stroke='#0ea5e9' strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
    </ChartContainer>
  )
}
