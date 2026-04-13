import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, normalizeFraudValue } from '@/utils/format'

export function RecentClaimsTable({ rows = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Claims</CardTitle>
      </CardHeader>
      <CardContent className='overflow-x-auto'>
        <table className='w-full min-w-140 text-sm'>
          <thead>
            <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400'>
              <th className='py-3'>Date</th>
              <th className='py-3'>Provider</th>
              <th className='py-3'>Amount</th>
              <th className='py-3'>Risk</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isFraud = normalizeFraudValue(row.fraud ?? row.Fraud)
              return (
                <tr key={`${row.id}-${row.date}`} className='border-b border-slate-100 dark:border-slate-900'>
                  <td className='py-3 text-slate-500 dark:text-slate-400'>{row.date}</td>
                  <td className='py-3 font-medium text-slate-800 dark:text-slate-200'>{row.provider || row.Provider}</td>
                  <td className='py-3 text-slate-700 dark:text-slate-300'>{formatCurrency(row.amount || row.ClaimAmount)}</td>
                  <td className='py-3'>
                    <Badge tone={isFraud ? 'danger' : 'success'}>{isFraud ? 'Fraud' : 'Safe'}</Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
