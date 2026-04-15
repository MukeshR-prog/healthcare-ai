import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/tables/DataTable'
import { formatCurrency, normalizeFraudValue } from '@/utils/format'

export function RecentClaimsTable({ rows = [] }) {
  const formatDate = (value) => {
    if (!value) return '-'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return String(value)
    return parsed.toLocaleString()
  }

  const headers = [
    { key: 'date', label: 'Date' },
    { key: 'provider', label: 'Provider' },
    { key: 'amount', label: 'Amount' },
    { key: 'risk', label: 'Risk' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Claims</CardTitle>
      </CardHeader>
      <CardContent className='overflow-x-auto'>
        <DataTable
          minWidth='min-w-140'
          headers={headers}
          rows={rows}
          renderRow={(row) => {
            const isFraud = normalizeFraudValue(row.fraud ?? row.Fraud)
            return (
              <tr key={`${row.id}-${row.date}`} className='border-b border-slate-100 dark:border-slate-900'>
                <td className='py-3 text-slate-500 dark:text-slate-400'>{formatDate(row.date)}</td>
                <td className='py-3 font-medium text-slate-800 dark:text-slate-200'>{row.provider || row.Provider}</td>
                <td className='py-3 text-slate-700 dark:text-slate-300'>{formatCurrency(row.amount || row.ClaimAmount)}</td>
                <td className='py-3'>
                  <Badge tone={isFraud ? 'danger' : 'success'}>{isFraud ? 'Fraud' : 'Safe'}</Badge>
                </td>
              </tr>
            )
          }}
        />
      </CardContent>
    </Card>
  )
}
