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
        {/* Metric Cards Skeleton */}
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`metric-skeleton-${idx}`} className='relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-950/80 shadow-xs'>
              <div className='flex items-center justify-between'>
                <Skeleton className='h-3.5 w-24' />
                <Skeleton className='h-9 w-9 rounded-2xl' />
              </div>
              <Skeleton className='mt-3.5 h-8 w-28' />
              <Skeleton className='mt-3 h-3 w-40' />
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className='grid gap-6 xl:grid-cols-2'>
          {/* Pie Chart Skeleton */}
          <div className='rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-950/80 shadow-xs space-y-4'>
            <div className='space-y-2'>
              <Skeleton className='h-4 w-36' />
              <Skeleton className='h-3 w-64' />
            </div>
            <div className='flex h-48 items-center justify-center'>
              <div className='relative flex h-36 w-36 items-center justify-center rounded-full border-12 border-slate-100 dark:border-slate-800/80 animate-pulse'>
                <div className='h-20 w-20 rounded-full bg-white dark:bg-slate-950 shadow-inner' />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-2 pt-2'>
              <Skeleton className='h-10 rounded-xl' />
              <Skeleton className='h-10 rounded-xl' />
            </div>
          </div>

          {/* Line Chart Skeleton */}
          <div className='rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-950/80 shadow-xs space-y-4 flex flex-col justify-between'>
            <div className='space-y-2'>
              <Skeleton className='h-4 w-44' />
              <Skeleton className='h-3 w-48' />
            </div>
            <div className='flex-1 h-48 flex items-end gap-3 px-2 pt-6 pb-2'>
              {/* Pulsing grid and mock line areas */}
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className='flex-1 flex flex-col justify-end h-full gap-2'>
                  <Skeleton 
                    className='w-full rounded-t-sm' 
                    style={{ height: `${Math.max(15, Math.sin(i / 1.5) * 50 + 50)}%` }} 
                  />
                </div>
              ))}
            </div>
            <div className='flex justify-between px-1 text-[10px] text-slate-400'>
              <Skeleton className='h-3 w-10' />
              <Skeleton className='h-3 w-10' />
              <Skeleton className='h-3 w-10' />
            </div>
          </div>
        </div>

        {/* Recent Claims Table Skeleton */}
        <div className='rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-950/80 shadow-xs space-y-4'>
          <div className='space-y-1'>
            <Skeleton className='h-4.5 w-32' />
            <Skeleton className='h-3 w-56' />
          </div>
          <div className='border-t border-slate-100 pt-3 dark:border-slate-800/60'>
            <div className='grid grid-cols-4 pb-2 border-b border-slate-100 dark:border-slate-800/40'>
              <Skeleton className='h-3.5 w-16' />
              <Skeleton className='h-3.5 w-24' />
              <Skeleton className='h-3.5 w-20' />
              <Skeleton className='h-3.5 w-12' />
            </div>
            <div className='space-y-3.5 mt-3.5'>
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={`row-skeleton-${idx}`} className='grid grid-cols-4 items-center'>
                  <Skeleton className='h-3.5 w-32' />
                  <Skeleton className='h-3.5 w-28 font-medium' />
                  <Skeleton className='h-3.5 w-20' />
                  <Skeleton className='h-6 w-14 rounded-full' />
                </div>
              ))}
            </div>
          </div>
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
      <div className='rounded-2xl border border-slate-200/80 bg-[linear-gradient(to_right,#f0f9ff,#ecfeff,#ffffff)] p-5 shadow-sm dark:border-slate-800 dark:bg-[linear-gradient(to_right,rgba(8,47,73,0.25),rgba(22,78,99,0.2),rgba(2,6,23,0.6))]'>
        <p className='text-xs font-medium uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300'>Operations Overview</p>
        <h2 className='mt-2 font-display text-2xl font-semibold tracking-tight'>Fraud Monitoring Command Center</h2>
        <p className='mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300'>
          Review risk volume, high-risk concentration, and claim movement trends in one place.
        </p>
      </div>

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

      <RecentClaimsTable rows={claims} />
    </section>
  )
}
