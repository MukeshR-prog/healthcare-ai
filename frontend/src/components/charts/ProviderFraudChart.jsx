import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartContainer } from '@/components/charts/ChartContainer'
import { formatCurrency } from '@/utils/format'
import { normalizeFraudValue } from '@/utils/format'

export function ProviderFraudChart({ rows = [], providerStats = [] }) {
  const hasProviderStats = Array.isArray(providerStats) && providerStats.length > 0

  if (hasProviderStats) {
    const data = providerStats.map((item) => ({
      provider: item.provider,
      avg_claim_amount: Number(item.avg_claim_amount || 0),
      claims_count: Number(item.claims_count || 0),
    }))

    return (
      <ChartContainer title='Average Claim by Provider' subtitle='Provider-level claim value comparison'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart data={data} margin={{ top: 8, right: 10, left: -14, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray='4 4' stroke='#cbd5e1' opacity={0.5} />
            <XAxis dataKey='provider' tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #cbd5e1',
                boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)',
              }}
              formatter={(value) => formatCurrency(Number(value || 0))}
            />
            <Bar dataKey='avg_claim_amount' fill='#0284c7' radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    )
  }

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
    <ChartContainer title='Provider-wise Fraud Rate' subtitle='Fallback rate view when provider aggregates are unavailable'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart data={data} margin={{ top: 8, right: 10, left: -14, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray='4 4' stroke='#cbd5e1' opacity={0.5} />
          <XAxis dataKey='provider' tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
          <YAxis unit='%' tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #cbd5e1',
              boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)',
            }}
            formatter={(value) => `${Number(value || 0).toFixed(1)}%`}
          />
          <Bar dataKey='rate' fill='#f43f5e' radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
