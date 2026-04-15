import { useCallback } from 'react'
import { healthcareApi } from '@/services/api'
import { useStore } from '@/store/useStore'

export function useApi() {
  const setLoadingKey = useStore((state) => state.setLoadingKey)
  const setAnalytics = useStore((state) => state.setAnalytics)
  const setPrediction = useStore((state) => state.setPrediction)
  const setBatchResults = useStore((state) => state.setBatchResults)
  const setHistory = useStore((state) => state.setHistory)
  const setAuth = useStore((state) => state.setAuth)
  const clearAuth = useStore((state) => state.clearAuth)

  const withLoading = useCallback(
    async (key, fn) => {
      const alreadyLoading = Boolean(useStore.getState().loadingByKey?.[key])
      if (alreadyLoading) {
        return null
      }
      try {
        setLoadingKey(key, true)
        return await fn()
      } finally {
        setLoadingKey(key, false)
      }
    },
    [setLoadingKey],
  )

  const login = useCallback(
    async (payload) => {
      const response = await withLoading('auth', () => healthcareApi.login(payload))
      setAuth({
        accessToken: response.data.access_token,
        user: {
          id: response.data.user_id,
          email: response.data.email,
        },
      })
      return response.data
    },
    [setAuth, withLoading],
  )

  const register = useCallback(
    async (payload) => {
      const response = await withLoading('auth', () => healthcareApi.register(payload))
      setAuth({
        accessToken: response.data.access_token,
        user: {
          id: response.data.user_id,
          email: response.data.email,
        },
      })
      return response.data
    },
    [setAuth, withLoading],
  )

  const logout = useCallback(() => {
    clearAuth()
  }, [clearAuth])

  const fetchAnalytics = useCallback(async () => {
    const response = await withLoading('analytics', () => healthcareApi.getAnalytics())
    setAnalytics(response.data)
    return response.data
  }, [setAnalytics, withLoading])

  const fetchHistory = useCallback(async () => {
    const response = await withLoading('history', () => healthcareApi.getHistory())
    const items = response.data?.items || []
    setHistory(items)
    return items
  }, [setHistory, withLoading])

  const submitAnalyze = useCallback(
    async (payload) => {
      const response = await withLoading('analyze', () => healthcareApi.analyzeClaim(payload))
      setPrediction(response.data)
      return response.data
    },
    [setPrediction, withLoading],
  )

  const submitBatchAnalyze = useCallback(
    async (payload) => {
      const response = await withLoading('batch', () => healthcareApi.batchAnalyze(payload))
      const data = response.data?.results || []
      setBatchResults(data)
      return data
    },
    [setBatchResults, withLoading],
  )

  const submitCsvUpload = useCallback(
    async (file) => {
      const response = await withLoading('upload', () => healthcareApi.uploadCsv(file))
      const data = response.data?.results || []
      setBatchResults(data)
      return data
    },
    [setBatchResults, withLoading],
  )

  return {
    login,
    register,
    logout,
    fetchAnalytics,
    fetchHistory,
    submitAnalyze,
    submitBatchAnalyze,
    submitCsvUpload,
  }
}
