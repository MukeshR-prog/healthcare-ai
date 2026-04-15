import { useMemo, useState } from 'react'
import { BatchUploadForm } from '@/components/forms/BatchUploadForm'
import { BatchResultsTable } from '@/components/tables/BatchResultsTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { useApi } from '@/hooks/useApi'
import { useStore } from '@/store/useStore'
import { parseCsv } from '@/utils/csv'
import { toClaimRows } from '@/utils/mock'
import { formatCurrency, normalizeFraudValue } from '@/utils/format'

export default function BatchUpload() {
  const loading = useStore((state) => state.loadingByKey?.upload)
  const batchResults = useStore((state) => state.batchResults)
  const { submitCsvUpload } = useApi()
  const [previewRows, setPreviewRows] = useState([])

  const rows = toClaimRows(batchResults)
  const previewWithFlags = useMemo(
    () =>
      previewRows.slice(0, 12).map((row, index) => {
        const prediction = rows[index]?.prediction
        const isFraud = normalizeFraudValue(prediction)
        return {
          row: index + 1,
          provider: row.Provider || row.provider,
          amount: row.ClaimAmount || row.claim_amount,
          age: row.Age || row.age,
          procedures: row.NumProcedures || row.num_procedures,
          isFraud,
        }
      }),
    [previewRows, rows],
  )

  return (
    <section className='space-y-6'>
      <BatchUploadForm onSubmit={submitCsvUpload} onPreview={(text) => setPreviewRows(parseCsv(text))} loading={loading} />

      {previewWithFlags.length ? (
        <Card>
          <CardHeader>
            <CardTitle>CSV Preview</CardTitle>
          </CardHeader>
          <CardContent className='overflow-x-auto'>
            <table className='w-full min-w-190 text-sm'>
              <thead>
                <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400'>
                  <th className='py-2'>Row</th>
                  <th className='py-2'>Provider</th>
                  <th className='py-2'>Age</th>
                  <th className='py-2'>Claim Amount</th>
                  <th className='py-2'>Procedures</th>
                </tr>
              </thead>
              <tbody>
                {previewWithFlags.map((row) => (
                  <tr
                    key={`preview-${row.row}`}
                    className={`border-b border-slate-100 dark:border-slate-900 ${
                      row.isFraud ? 'bg-rose-50/80 dark:bg-rose-950/20' : ''
                    }`}
                  >
                    <td className='py-2'>{row.row}</td>
                    <td className='py-2'>{row.provider || '-'}</td>
                    <td className='py-2'>{row.age ?? '-'}</td>
                    <td className='py-2'>{formatCurrency(row.amount)}</td>
                    <td className='py-2'>{row.procedures ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      {rows.length ? (
        <BatchResultsTable rows={rows} />
      ) : (
        <EmptyState
          title='No Batch Results'
          description='Upload a CSV file to run fraud prediction at scale. Fraud rows will be highlighted automatically.'
        />
      )}
    </section>
  )
}
