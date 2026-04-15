import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ResultCard } from '@/components/cards/ResultCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { HistoryTable } from '@/components/tables/HistoryTable'
import { useApi } from '@/hooks/useApi'
import { useStore } from '@/store/useStore'
import { formatCurrency, formatPercent } from '@/utils/format'

export default function History() {
  const history = useStore((state) => state.history)
  const loading = useStore((state) => state.loadingByKey?.history)
  const { fetchHistory } = useApi()
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  useEffect(() => {
    if (!selected && history?.length) {
      setSelected(history[0])
    }
  }, [history, selected])

  const selectedClaim = selected?.claim || {}
  const selectedPrediction = useMemo(
    () => selected?.latest_prediction || selected?.predictions?.[0] || {},
    [selected],
  )

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400'>
          <Spinner />
          Loading prediction history...
        </div>
      </div>
    )
  }

  if (!history?.length) {
    return (
      <EmptyState
        title='No Claim History Yet'
        description='Once you analyze claims, your user-specific history will appear here.'
      />
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className='grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]'
    >
      <HistoryTable items={history} selectedId={selectedClaim?.id} onSelect={setSelected} />

      <Card>
        <CardHeader>
          <CardTitle>Claim Details</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {selected ? (
            <>
              <ResultCard title='Provider' value={selectedClaim.provider || '-'} />
              <ResultCard title='Claim Amount' value={formatCurrency(selectedClaim.claim_amount)} />
              <ResultCard title='Prediction Confidence' value={formatPercent(selectedPrediction.confidence || 0)} />
              <ResultCard title='Summary' value={selectedPrediction.summary || 'No summary available'} />
              <ResultCard title='Explanation' value={selectedPrediction.explanation || 'No explanation available'} />
            </>
          ) : (
            <p className='text-sm text-slate-500 dark:text-slate-400'>Select a claim row to inspect details.</p>
          )}
        </CardContent>
      </Card>
    </motion.section>
  )
}
