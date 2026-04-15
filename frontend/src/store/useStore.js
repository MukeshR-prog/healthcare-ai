import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set) => ({
      theme: 'system',
      loading: false,
      loadingByKey: {},
      analytics: null,
      prediction: null,
      batchResults: [],
      history: [],
      auth: {
        accessToken: null,
        user: null,
      },
      setTheme: (theme) => set({ theme }),
      setLoading: (loading) => set({ loading }),
      setLoadingKey: (key, isLoading) =>
        set((state) => {
          const loadingByKey = {
            ...state.loadingByKey,
            [key]: isLoading,
          }
          const loading = Object.values(loadingByKey).some(Boolean)
          return { loadingByKey, loading }
        }),
      setAnalytics: (analytics) => set({ analytics }),
      setPrediction: (prediction) => set({ prediction }),
      setBatchResults: (batchResults) => set({ batchResults }),
      setHistory: (history) => set({ history }),
      setAuth: (auth) => set({ auth }),
      clearAuth: () =>
        set({
          auth: {
            accessToken: null,
            user: null,
          },
          history: [],
          prediction: null,
          batchResults: [],
        }),
    }),
    {
      name: 'healthcare-saas-store',
      partialize: (state) => ({
        theme: state.theme,
        auth: state.auth,
      }),
    },
  ),
)
