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
  const setAlerts = useStore((state) => state.setAlerts)
  const setCases = useStore((state) => state.setCases)

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

  const forgotPassword = useCallback(
    async (payload) => {
      const response = await withLoading('auth', () => healthcareApi.forgotPassword(payload))
      return response?.data
    },
    [withLoading],
  )

  const resetPassword = useCallback(
    async (payload) => {
      const response = await withLoading('auth', () => healthcareApi.resetPassword(payload))
      return response?.data
    },
    [withLoading],
  )

  const logout = useCallback(() => {
    clearAuth()
  }, [clearAuth])

  const fetchAnalytics = useCallback(async () => {
    const response = await withLoading('analytics', () => healthcareApi.getAnalytics())
    if (response) {
      setAnalytics(response.data)
      return response.data
    }
  }, [setAnalytics, withLoading])

  const fetchHistory = useCallback(async () => {
    const response = await withLoading('history', () => healthcareApi.getHistory())
    if (response) {
      const items = response.data?.items || []
      setHistory(items)
      return items
    }
    return []
  }, [setHistory, withLoading])

  const submitAnalyze = useCallback(
    async (payload) => {
      const response = await withLoading('analyze', () => healthcareApi.analyzeClaim(payload))
      if (response) {
        setPrediction(response.data)
        return response.data
      }
    },
    [setPrediction, withLoading],
  )

  const submitBatchAnalyze = useCallback(
    async (payload) => {
      const response = await withLoading('batch', () => healthcareApi.batchAnalyze(payload))
      if (response) {
        const data = response.data?.results || []
        setBatchResults(data)
        return data
      }
      return []
    },
    [setBatchResults, withLoading],
  )

  const submitCsvUpload = useCallback(
    async (file) => {
      const response = await withLoading('upload', () => healthcareApi.uploadCsv(file))
      if (response) {
        const data = response.data?.results || []
        setBatchResults(data)
        return data
      }
      return []
    },
    [setBatchResults, withLoading],
  )

  const fetchAlerts = useCallback(
    async (params) => {
      const response = await withLoading('alerts', () => healthcareApi.getAlerts(params))
      if (response) {
        const rawItems = response.data?.items || []
        const mappedItems = rawItems.map(item => ({
          id: item._id || item.id,
          claimId: item.claim_id,
          provider: item.provider,
          amount: item.claim_amount,
          procedures: item.procedures || 1,
          gender: item.gender || 'O',
          riskScore: item.risk_score,
          severity: item.severity,
          status: item.status,
          notes: Array.isArray(item.notes) 
            ? item.notes.map(n => n.text).join('\n') 
            : (item.notes || ''),
          created_at: item.created_at
        }))
        setAlerts(mappedItems)
        return mappedItems
      }
      return []
    },
    [setAlerts, withLoading],
  )

  const fetchCases = useCallback(
    async (params) => {
      const response = await withLoading('cases', () => healthcareApi.getCases(params))
      if (response) {
        const rawItems = response.data?.items || []
        const mappedItems = rawItems.map(item => ({
          id: item.id || item._id,
          caseId: item.case_id,
          alertId: item.alert_id,
          claimId: item.claim_id,
          provider: item.provider,
          amount: item.amount || item.claim_amount || 0,
          riskScore: item.riskScore || item.risk_score || 0,
          severity: item.severity,
          status: item.status,
          priority: item.priority,
          assignedTo: item.assignedTo || item.assigned_to,
          created_at: item.created_at,
          updated_at: item.updated_at,
          created_by: item.created_by,
          notes: (item.notes || []).map(n => ({
            analyst: n.analyst || n.author,
            text: n.text || n.note,
            date: n.date || n.created_at
          })),
          timeline: (item.timeline || []).map(t => ({
            title: t.title || t.event_type,
            desc: t.desc || t.description,
            date: t.date || t.created_at,
            status: t.status || t.event_type || 'New'
          }))
        }))
        setCases(mappedItems)
        return mappedItems
      }
      return []
    },
    [setCases, withLoading],
  )

  const fetchProviders = useCallback(
    async (params) => {
      const response = await withLoading('providers', () => healthcareApi.getProviders(params))
      if (response) {
        useStore.setState({ providers: response.data })
        return response.data
      }
      return []
    },
    [withLoading],
  )

  const fetchProviderMetrics = useCallback(
    async () => {
      const response = await withLoading('providerMetrics', () => healthcareApi.getProviderMetrics())
      if (response) {
        useStore.setState({ providerMetrics: response.data })
        return response.data
      }
      return null
    },
    [withLoading],
  )

  const fetchProviderTrends = useCallback(
    async () => {
      const response = await withLoading('providerTrends', () => healthcareApi.getProviderTrends())
      if (response) {
        useStore.setState({ providerTrends: response.data })
        return response.data
      }
      return []
    },
    [withLoading],
  )

  return {
    login,
    register,
    forgotPassword,
    resetPassword,
    logout,
    fetchAnalytics,
    fetchHistory,
    submitAnalyze,
    submitBatchAnalyze,
    submitCsvUpload,
    fetchAlerts,
    fetchCases,
    fetchProviders,
    fetchProviderMetrics,
    fetchProviderTrends,
  }
}
