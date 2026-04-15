import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartContainer } from '@/components/charts/ChartContainer'

const COLORS = ['#0284c7', '#f97316', '#8b5cf6', '#14b8a6']

export function GenderDistributionChart({ data = [] }) {
  const normalized = data.map((item) => ({
    name: item.gender || 'Unknown',
    value: Number(item.count || 0),
  }))

  return (
    <ChartContainer title='Gender Distribution'>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie data={normalized} dataKey='value' nameKey='name' cx='50%' cy='50%' outerRadius={90} label>
              {normalized.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
    </ChartContainer>
  )
}
