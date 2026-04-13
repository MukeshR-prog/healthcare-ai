import { BatchUploadForm } from '@/components/forms/BatchUploadForm'
import { BatchResultsTable } from '@/components/tables/BatchResultsTable'
import { EmptyState } from '@/components/ui/empty-state'
import { useApi } from '@/hooks/useApi'
import { useStore } from '@/store/useStore'
import { toClaimRows } from '@/utils/mock'

export default function BatchUpload() {
  const loading = useStore((state) => state.loading)
  const batchResults = useStore((state) => state.batchResults)
  const { submitBatchAnalyze } = useApi()

  const rows = toClaimRows(batchResults)

  return (
    <section className='space-y-6'>
      <BatchUploadForm onSubmit={submitBatchAnalyze} loading={loading} />
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
