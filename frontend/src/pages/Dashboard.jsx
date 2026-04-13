import { useEffect, useMemo } from 'react'
import { Activity, AlertTriangle, DollarSign } from 'lucide-react'
import { MetricCard } from '@/components/cards/MetricCard'
import { FraudPieChart } from '@/components/charts/FraudPieChart'
import { ClaimsLineChart } from '@/components/charts/ClaimsLineChart'
import { EmptyState } from '@/components/ui/empty-state'
import { RecentClaimsTable } from '@/components/tables/RecentClaimsTable'
import { useApi } from '@/hooks/useApi'
import { useStore } from '@/store/useStore'
import { formatCurrency } from '@/utils/format'
import { buildFallbackClaims } from '@/utils/mock'

export default function Dashboard() {
  const analytics = useStore((state) => state.analytics)
  const loading = useStore((state) => state.loading)
  const { fetchAnalytics } = useApi()

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const claims = useMemo(() => {
    if (!analytics) return []
    return buildFallbackClaims(analytics.total_claims, analytics.fraud_cases, analytics.avg_claim_amount)
  }, [analytics])

  const trendData = claims.map((row) => ({ date: row.date.slice(5), amount: row.amount }))

  if (!loading && !analytics) {
    return <EmptyState title='No Analytics Yet' description='Analytics data will appear once the backend responds.' />
  }

  return (
    <section className='space-y-6'>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        <MetricCard
          title='Total Claims'
          value={analytics?.total_claims ?? '--'}
          subtitle='Current records processed'
          icon={Activity}
          delay={0}
        />
        <MetricCard
          title='Fraud Cases'
          value={analytics?.fraud_cases ?? '--'}
          subtitle='Flagged by model'
          icon={AlertTriangle}
          delay={0.08}
        />
        <MetricCard
          title='Average Claim'
          value={analytics ? formatCurrency(analytics.avg_claim_amount) : '--'}
          subtitle='Average amount per claim'
          icon={DollarSign}
          delay={0.16}
        />
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <FraudPieChart fraudCases={analytics?.fraud_cases} totalClaims={analytics?.total_claims} />
        <ClaimsLineChart data={trendData} />
      </div>

      <RecentClaimsTable rows={claims.slice(0, 8)} />
    </section>
  )
}
