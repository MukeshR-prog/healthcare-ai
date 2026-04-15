import { useEffect, useMemo } from 'react'
import { Activity, AlertTriangle, DollarSign, ShieldAlert } from 'lucide-react'
import { MetricCard } from '@/components/cards/MetricCard'
import { FraudPieChart } from '@/components/charts/FraudPieChart'
import { ClaimsLineChart } from '@/components/charts/ClaimsLineChart'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { RecentClaimsTable } from '@/components/tables/RecentClaimsTable'
import { useApi } from '@/hooks/useApi'
import { useStore } from '@/store/useStore'
import { formatCurrency, formatPercent } from '@/utils/format'
import { buildFallbackClaims } from '@/utils/mock'

export default function Dashboard() {
  const analytics = useStore((state) => state.analytics)
  const history = useStore((state) => state.history)
  const loadingAnalytics = useStore((state) => state.loadingByKey?.analytics)
  const loadingHistory = useStore((state) => state.loadingByKey?.history)
  const { fetchAnalytics, fetchHistory } = useApi()

  useEffect(() => {
    fetchAnalytics()
    fetchHistory()
  }, [fetchAnalytics, fetchHistory])

  const summary = analytics?.summary || analytics

  const claims = useMemo(() => {
    if (history?.length) {
      return history.map((item) => ({
        id: item.claim?.id,
        date: item.claim?.created_at,
        provider: item.claim?.provider,
        amount: item.claim?.claim_amount,
        fraud: item.latest_prediction?.prediction,
      }))
    }
    if (!summary) return []
    return buildFallbackClaims(summary.total_claims, summary.fraud_cases, summary.avg_claim_amount)
  }, [history, summary])

  const trendData = claims.slice(0, 12).map((row) => ({
    date: row?.date ? new Date(row.date).toLocaleDateString() : '-',
    amount: Number(row?.amount || 0),
  }))

  if ((loadingAnalytics || loadingHistory) && !analytics) {
    return (
      <section className='space-y-6'>
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`metric-skeleton-${idx}`} className='rounded-2xl border border-slate-200/80 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-950/70'>
              <Skeleton className='h-4 w-26' />
              <Skeleton className='mt-4 h-8 w-20' />
              <Skeleton className='mt-2 h-3 w-32' />
            </div>
          ))}
        </div>
        <div className='grid gap-6 xl:grid-cols-2'>
          <Skeleton className='h-80 rounded-2xl' />
          <Skeleton className='h-80 rounded-2xl' />
        </div>
      </section>
    )
  }

  if (!analytics) {
    return (
      <EmptyState
        title='No Analytics Yet'
        description='Analytics data will appear once the backend responds.'
        action={
          <button
            type='button'
            onClick={fetchAnalytics}
            className='rounded-xl bg-sky-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-sky-700'
          >
            Retry Analytics Fetch
          </button>
        }
      />
    )
  }

  return (
    <section className='space-y-6'>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <MetricCard
          title='Total Claims'
          value={summary?.total_claims ?? '--'}
          subtitle='Current records processed'
          icon={Activity}
          delay={0}
        />
        <MetricCard
          title='Fraud Cases'
          value={summary?.fraud_cases ?? '--'}
          subtitle='Flagged by model'
          icon={AlertTriangle}
          delay={0.08}
        />
        <MetricCard
          title='Average Claim'
          value={summary ? formatCurrency(summary.avg_claim_amount) : '--'}
          subtitle='Average amount per claim'
          icon={DollarSign}
          delay={0.16}
        />
        <MetricCard
          title='High-Risk Claims'
          value={summary?.high_risk_claims_count ?? '--'}
          subtitle={summary ? `Fraud rate ${formatPercent((summary.fraud_rate_pct || 0) / 100)}` : 'Probability >= threshold'}
          icon={ShieldAlert}
          delay={0.24}
        />
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <FraudPieChart fraudCases={summary?.fraud_cases} totalClaims={summary?.total_claims} />
        <ClaimsLineChart data={trendData} />
      </div>

      <RecentClaimsTable rows={claims.slice(0, 8)} />
    </section>
  )
}
