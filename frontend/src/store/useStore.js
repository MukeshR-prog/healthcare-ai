import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set) => ({
      theme: 'light',
      loading: false,
      analytics: null,
      prediction: null,
      batchResults: [],
      setTheme: (theme) => set({ theme }),
      setLoading: (loading) => set({ loading }),
      setAnalytics: (analytics) => set({ analytics }),
      setPrediction: (prediction) => set({ prediction }),
      setBatchResults: (batchResults) => set({ batchResults }),
    }),
    {
      name: 'healthcare-saas-store',
      partialize: (state) => ({
        theme: state.theme,
      }),
    },
  ),
)
