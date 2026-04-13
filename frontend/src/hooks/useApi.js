import { useCallback } from 'react'
import { healthcareApi } from '@/services/api'
import { useStore } from '@/store/useStore'

export function useApi() {
  const setLoading = useStore((state) => state.setLoading)
  const setAnalytics = useStore((state) => state.setAnalytics)
  const setPrediction = useStore((state) => state.setPrediction)
  const setBatchResults = useStore((state) => state.setBatchResults)

  const withLoading = useCallback(
    async (fn) => {
      try {
        setLoading(true)
        return await fn()
      } finally {
        setLoading(false)
      }
    },
    [setLoading],
  )

  const fetchAnalytics = useCallback(async () => {
    const response = await withLoading(() => healthcareApi.getAnalytics())
    setAnalytics(response.data)
    return response.data
  }, [setAnalytics, withLoading])

  const submitAnalyze = useCallback(
    async (payload) => {
      const response = await withLoading(() => healthcareApi.analyzeClaim(payload))
      setPrediction(response.data)
      return response.data
    },
    [setPrediction, withLoading],
  )

  const submitBatchAnalyze = useCallback(
    async (payload) => {
      const response = await withLoading(() => healthcareApi.batchAnalyze(payload))
      const data = response.data?.results || []
      setBatchResults(data)
      return data
    },
    [setBatchResults, withLoading],
  )

  return {
    fetchAnalytics,
    submitAnalyze,
    submitBatchAnalyze,
  }
}
