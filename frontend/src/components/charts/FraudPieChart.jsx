import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const COLORS = ['#0ea5e9', '#f43f5e']

export function FraudPieChart({ fraudCases = 0, totalClaims = 0 }) {
  const safeFraud = Number(fraudCases || 0)
  const safeTotal = Number(totalClaims || 0)
  const safeNonFraud = Math.max(safeTotal - safeFraud, 0)

  const data = [
    { name: 'Non-Fraud', value: safeNonFraud },
    { name: 'Fraud', value: safeFraud },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fraud Distribution</CardTitle>
      </CardHeader>
      <CardContent className='h-72'>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie data={data} dataKey='value' nameKey='name' cx='50%' cy='50%' outerRadius={90} label>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
