import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { normalizeFraudValue } from '@/utils/format'

export function ProviderFraudChart({ rows = [] }) {
  const byProvider = rows.reduce((acc, row) => {
    const provider = row.provider || row.Provider || 'Unknown'
    const isFraud = normalizeFraudValue(row.fraud ?? row.Fraud ?? row.prediction ?? row.fraud_prediction)
    if (!acc[provider]) {
      acc[provider] = { provider, fraud: 0, total: 0 }
    }
    acc[provider].total += 1
    if (isFraud) acc[provider].fraud += 1
    return acc
  }, {})

  const data = Object.values(byProvider).map((item) => ({
    provider: item.provider,
    rate: Number(((item.fraud / Math.max(item.total, 1)) * 100).toFixed(1)),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider-wise Fraud Rate</CardTitle>
      </CardHeader>
      <CardContent className='h-72'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray='3 3' stroke='#cbd5e1' />
            <XAxis dataKey='provider' />
            <YAxis unit='%' />
            <Tooltip />
            <Bar dataKey='rate' fill='#f43f5e' radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
