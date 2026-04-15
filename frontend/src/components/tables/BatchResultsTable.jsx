import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/tables/DataTable'
import { formatPercent, normalizeFraudValue } from '@/utils/format'

export function BatchResultsTable({ rows = [] }) {
  const headers = [
    { key: 'row', label: 'Row' },
    { key: 'prediction', label: 'Prediction' },
    { key: 'confidence', label: 'Confidence' },
    { key: 'status', label: 'Status' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Prediction Results</CardTitle>
      </CardHeader>
      <CardContent className='overflow-x-auto'>
        <DataTable
          minWidth='min-w-[720px]'
          headers={headers}
          rows={rows}
          renderRow={(row) => {
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
          }}
        />
      </CardContent>
    </Card>
  )
}
