import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPercent, normalizeFraudValue } from '@/utils/format'

export function BatchResultsTable({ rows = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Prediction Results</CardTitle>
      </CardHeader>
      <CardContent className='overflow-x-auto'>
        <table className='w-full min-w-130 text-sm'>
          <thead>
            <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400'>
              <th className='py-3'>Row</th>
              <th className='py-3'>Prediction</th>
              <th className='py-3'>Confidence</th>
              <th className='py-3'>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isFraud = normalizeFraudValue(row.prediction ?? row.fraud_prediction ?? row.fraud)
              return (
                <tr
                  key={row.id}
                  className={`border-b border-slate-100 dark:border-slate-900 ${
                    isFraud ? 'bg-rose-50/80 dark:bg-rose-950/20' : ''
                  }`}
                >
                  <td className='py-3 font-medium text-slate-700 dark:text-slate-300'>{row.id}</td>
                  <td className='py-3 text-slate-700 dark:text-slate-300'>{String(row.prediction ?? row.fraud_prediction)}</td>
                  <td className='py-3 text-slate-700 dark:text-slate-300'>{formatPercent(row.confidence || 0)}</td>
                  <td className='py-3'>
                    <Badge tone={isFraud ? 'danger' : 'success'}>{isFraud ? 'Fraud Risk' : 'Low Risk'}</Badge>
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
