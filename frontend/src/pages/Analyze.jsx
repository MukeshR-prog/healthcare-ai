import { motion } from 'framer-motion'
import { AnalyzeForm } from '@/components/forms/AnalyzeForm'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useApi } from '@/hooks/useApi'
import { useStore } from '@/store/useStore'
import { formatPercent, normalizeFraudValue } from '@/utils/format'

export default function Analyze() {
  const loading = useStore((state) => state.loading)
  const prediction = useStore((state) => state.prediction)
  const { submitAnalyze } = useApi()

  const confidenceValue = Math.round((prediction?.confidence || 0) * 100)
  const isFraud = normalizeFraudValue(prediction?.fraud_prediction)

  return (
    <section className='space-y-6'>
      <AnalyzeForm onSubmit={submitAnalyze} loading={loading} />

      {prediction ? (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle>Prediction Result</CardTitle>
            </CardHeader>
            <CardContent className='space-y-5'>
              <div className='flex flex-wrap items-center gap-3'>
                <Badge tone={isFraud ? 'danger' : 'success'}>{isFraud ? 'Fraud Detected' : 'Low Fraud Risk'}</Badge>
                <span className='text-sm text-slate-500 dark:text-slate-400'>
                  Confidence: <strong>{formatPercent(prediction.confidence || 0)}</strong>
                </span>
              </div>

              <Progress value={confidenceValue} />

              <div className='grid gap-4 md:grid-cols-2'>
                <div className='rounded-xl border border-slate-200 p-4 dark:border-slate-800'>
                  <p className='mb-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400'>Summary</p>
                  <p className='text-sm text-slate-700 dark:text-slate-300'>{prediction.summary || 'No summary provided.'}</p>
                </div>
                <div className='rounded-xl border border-slate-200 p-4 dark:border-slate-800'>
                  <p className='mb-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400'>Explanation</p>
                  <p className='text-sm text-slate-700 dark:text-slate-300'>{prediction.explanation || 'No explanation provided.'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}
    </section>
  )
}
