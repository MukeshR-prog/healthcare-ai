import { useEffect, useMemo } from 'react'
import { ClaimHistogram } from '@/components/charts/ClaimHistogram'
import { FraudPieChart } from '@/components/charts/FraudPieChart'
import { GenderDistributionChart } from '@/components/charts/GenderDistributionChart'
import { ProviderFraudChart } from '@/components/charts/ProviderFraudChart'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useApi } from '@/hooks/useApi'
import { useStore } from '@/store/useStore'
import { buildFallbackClaims } from '@/utils/mock'

export default function Analytics() {
  const analytics = useStore((state) => state.analytics)
  const loading = useStore((state) => state.loadingByKey?.analytics)
  const { fetchAnalytics } = useApi()

  useEffect(() => {
    if (!analytics) {
      fetchAnalytics()
    }
  }, [analytics, fetchAnalytics])

  const summary = analytics?.summary || analytics
  const chartData = analytics?.charts || {}

  const rows = useMemo(() => {
    if (!summary) return []
    return buildFallbackClaims(summary.total_claims, summary.fraud_cases, summary.avg_claim_amount)
  }, [summary])

  if (loading && !analytics) {
    return (
      <section className='grid gap-6 xl:grid-cols-2'>
        <Skeleton className='h-80 rounded-2xl' />
        <Skeleton className='h-80 rounded-2xl' />
        <Skeleton className='h-80 rounded-2xl' />
        <Skeleton className='h-80 rounded-2xl' />
      </section>
    )
  }

  if (!analytics) {
    return (
      <EmptyState
        title='Analytics Unavailable'
        description='Open Dashboard first or verify backend /analytics endpoint is running.'
        action={
          <button
            type='button'
            onClick={fetchAnalytics}
            className='rounded-xl bg-sky-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-sky-700'
          >
            Retry
          </button>
        }
      />
    )
  }

  return (
    <section className='space-y-6'>
      <div className='rounded-2xl border border-slate-200/80 bg-linear-to-r from-amber-50 via-white to-cyan-50 p-5 shadow-sm dark:border-slate-800 dark:from-amber-950/20 dark:via-slate-950/60 dark:to-cyan-950/20'>
        <p className='text-xs font-medium uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300'>Advanced Insights</p>
        <h2 className='mt-2 font-display text-2xl font-semibold tracking-tight'>Fraud Pattern Analytics</h2>
        <p className='mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300'>
          Explore behavior patterns by provider, amount bands, and demographic distribution to improve investigation triage.
        </p>
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <FraudPieChart fraudCases={summary.fraud_cases} totalClaims={summary.total_claims} />
        <GenderDistributionChart data={chartData.gender_distribution || []} />
        <ClaimHistogram rows={rows} />
        <div>
          <ProviderFraudChart providerStats={chartData.average_claim_by_provider || []} />
          <div className='mt-6 rounded-2xl border border-slate-200/80 bg-white/85 p-5 dark:border-slate-800 dark:bg-slate-950/70'>
            <h3 className='font-display text-lg font-semibold'>Fraud Monitoring Snapshot</h3>
            <div className='mt-4 grid gap-4 sm:grid-cols-2'>
              <div className='rounded-xl border border-slate-200/80 p-4 dark:border-slate-800'>
                <p className='text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400'>Fraud Rate</p>
                <p className='mt-1 text-2xl font-semibold'>{Number(summary.fraud_rate_pct || 0).toFixed(1)}%</p>
              </div>
              <div className='rounded-xl border border-slate-200/80 p-4 dark:border-slate-800'>
                <p className='text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400'>High-Risk Claims</p>
                <p className='mt-1 text-2xl font-semibold'>{summary.high_risk_claims_count ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
