import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/tables/DataTable'
import { formatCurrency, formatPercent, normalizeFraudValue } from '@/utils/format'

export function HistoryTable({ items = [], onSelect, selectedId }) {
  const headers = [
    { key: 'date', label: 'Date' },
    { key: 'provider', label: 'Provider' },
    { key: 'amount', label: 'Claim Amount' },
    { key: 'procedures', label: 'Procedures' },
    { key: 'prediction', label: 'Prediction' },
    { key: 'confidence', label: 'Confidence' },
    { key: 'status', label: 'Status' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prediction History</CardTitle>
      </CardHeader>
      <CardContent className='overflow-x-auto'>
        <DataTable
          minWidth='min-w-[860px]'
          headers={headers}
          rows={items}
          renderRow={(item) => {
            const claim = item.claim || {}
            const latest = item.latest_prediction || item.predictions?.[0] || {}
            const isFraud = normalizeFraudValue(latest.prediction)
            const isSelected = selectedId && selectedId === claim.id
            return (
              <tr
                key={claim.id}
                className={`cursor-pointer border-b border-slate-100 transition dark:border-slate-900 ${
                  isSelected ? 'bg-sky-50 dark:bg-sky-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-900/60'
                }`}
                onClick={() => onSelect?.(item)}
              >
                <td className='py-3 text-slate-500 dark:text-slate-400'>
                  {claim.created_at ? new Date(claim.created_at).toLocaleString() : '-'}
                </td>
                <td className='py-3 font-medium text-slate-800 dark:text-slate-200'>{claim.provider || '-'}</td>
                <td className='py-3 text-slate-700 dark:text-slate-300'>{formatCurrency(claim.claim_amount)}</td>
                <td className='py-3 text-slate-700 dark:text-slate-300'>{claim.num_procedures ?? '-'}</td>
                <td className='py-3 text-slate-700 dark:text-slate-300'>{String(latest.prediction ?? '-')}</td>
                <td className='py-3 text-slate-700 dark:text-slate-300'>{formatPercent(latest.confidence || 0)}</td>
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
