import { motion } from 'framer-motion'
import { AnalyzeForm } from '@/components/forms/AnalyzeForm'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ResultCard } from '@/components/cards/ResultCard'
import { useApi } from '@/hooks/useApi'
import { useStore } from '@/store/useStore'
import { formatPercent, normalizeFraudValue } from '@/utils/format'

export default function Analyze() {
  const loading = useStore((state) => state.loadingByKey?.analyze)
  const prediction = useStore((state) => state.prediction)
  const { submitAnalyze } = useApi()

  const confidenceValue = Math.round((prediction?.confidence || 0) * 100)
  const isFraud = normalizeFraudValue(prediction?.fraud_prediction)

  return (
    <section className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>
      <AnalyzeForm onSubmit={submitAnalyze} loading={loading} />

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className='h-full'>
          <CardHeader>
            <CardTitle>Prediction Result</CardTitle>
          </CardHeader>
          <CardContent className='space-y-5'>
            {prediction ? (
              <>
                <div className='flex flex-wrap items-center gap-3'>
                  <Badge tone={isFraud ? 'danger' : 'success'}>{isFraud ? 'Fraud Detected' : 'Low Fraud Risk'}</Badge>
                  <span className='text-sm text-slate-500 dark:text-slate-400'>
                    Confidence: <strong>{formatPercent(prediction.confidence || 0)}</strong>
                  </span>
                </div>

                <Progress value={confidenceValue} />

                <div className='grid gap-4 md:grid-cols-2'>
                  <ResultCard title='Summary' value={prediction.summary || 'No summary provided.'} />
                  <ResultCard title='Explanation' value={prediction.explanation || 'No explanation provided.'} />
                </div>
              </>
            ) : (
              <div className='grid h-full place-items-center rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700'>
                <p className='max-w-sm text-sm text-slate-500 dark:text-slate-400'>
                  Submit a claim from the left panel to see fraud score, confidence, summary, and explanation.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </section>
  )
}
