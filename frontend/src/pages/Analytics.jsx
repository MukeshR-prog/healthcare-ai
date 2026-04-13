import { useMemo } from 'react'
import { ClaimHistogram } from '@/components/charts/ClaimHistogram'
import { FraudPieChart } from '@/components/charts/FraudPieChart'
import { ProviderFraudChart } from '@/components/charts/ProviderFraudChart'
import { EmptyState } from '@/components/ui/empty-state'
import { useStore } from '@/store/useStore'
import { buildFallbackClaims } from '@/utils/mock'

export default function Analytics() {
  const analytics = useStore((state) => state.analytics)

  const rows = useMemo(() => {
    if (!analytics) return []
    return buildFallbackClaims(analytics.total_claims, analytics.fraud_cases, analytics.avg_claim_amount)
  }, [analytics])

  if (!analytics) {
    return (
      <EmptyState
        title='Analytics Unavailable'
        description='Open Dashboard first or verify backend /analytics endpoint is running.'
      />
    )
  }

  return (
    <section className='grid gap-6 xl:grid-cols-2'>
      <FraudPieChart fraudCases={analytics.fraud_cases} totalClaims={analytics.total_claims} />
      <ClaimHistogram rows={rows} />
      <div className='xl:col-span-2'>
        <ProviderFraudChart rows={rows} />
      </div>
    </section>
  )
}
