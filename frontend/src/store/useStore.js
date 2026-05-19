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
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      alerts: [],
      cases: [],
      setTheme: (theme) => set({ theme }),
      setLoading: (loading) => set({ loading }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
      setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
      setAlerts: (alerts) => set({ alerts }),
      updateAlertStatus: (alertId, status) =>
        set((state) => ({
          alerts: state.alerts.map((a) => (a.id === alertId ? { ...a, status } : a)),
        })),
      updateAlertNotes: (alertId, notes) =>
        set((state) => ({
          alerts: state.alerts.map((a) => (a.id === alertId ? { ...a, notes } : a)),
        })),
      setCases: (cases) => set({ cases }),
      createCase: (alertItem, analystName = 'Unassigned', priority = 'Medium') =>
        set((state) => {
          const exists = state.cases.some((c) => c.alertId === alertItem.id || c.claimId === alertItem.claimId)
          if (exists) return {}
          
          const newCase = {
            id: `CASE-99${String(state.cases.length + 1).padStart(3, '0')}`,
            alertId: alertItem.id,
            claimId: alertItem.claimId,
            provider: alertItem.provider || 'Unknown Provider',
            amount: alertItem.amount || 0,
            riskScore: alertItem.riskScore || 0,
            severity: alertItem.severity || 'Medium',
            status: 'New',
            assignedTo: analystName,
            priority: priority,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            notes: alertItem.notes ? [{ text: alertItem.notes, date: new Date().toISOString(), analyst: 'System' }] : [],
            timeline: [
              { status: 'New', title: 'Case Created', date: new Date().toISOString(), desc: 'Investigation case initialized from fraud alert.' }
            ]
          }
          return { cases: [newCase, ...state.cases] }
        }),
      updateCaseStatus: (caseId, status, desc = '') =>
        set((state) => {
          const statusHistoryMap = {
            'New': 'Case Created',
            'Under Review': 'Review Started',
            'Investigating': 'Investigation Started',
            'Escalated': 'Case Escalated',
            'Confirmed Fraud': 'Fraud Confirmed',
            'Closed': 'Case Closed'
          }
          return {
            cases: state.cases.map((c) => {
              if (c.id !== caseId) return c
              const hasStatusInTimeline = c.timeline.some((t) => t.status === status)
              const newTimeline = hasStatusInTimeline 
                ? c.timeline 
                : [...c.timeline, { 
                    status, 
                    title: statusHistoryMap[status] || status, 
                    date: new Date().toISOString(), 
                    desc: desc || `Status updated to ${status}` 
                  }]
              return {
                ...c,
                status,
                updated_at: new Date().toISOString(),
                timeline: newTimeline
              }
            })
          }
        }),
      updateCaseAssignment: (caseId, assignedTo, priority) =>
        set((state) => ({
          cases: state.cases.map((c) =>
            c.id === caseId
              ? {
                  ...c,
                  assignedTo,
                  priority,
                  updated_at: new Date().toISOString(),
                  timeline: [...c.timeline, {
                    status: c.status,
                    title: 'Metadata Updated',
                    date: new Date().toISOString(),
                    desc: `Assigned to ${assignedTo} with ${priority} priority.`
                  }]
                }
              : c
          )
        })),
      addCaseNote: (caseId, text, analyst = 'Analyst') =>
        set((state) => ({
          cases: state.cases.map((c) =>
            c.id === caseId
              ? {
                  ...c,
                  updated_at: new Date().toISOString(),
                  notes: [...c.notes, { text, date: new Date().toISOString(), analyst }],
                  timeline: [...c.timeline, {
                    status: c.status,
                    title: 'Note Added',
                    date: new Date().toISOString(),
                    desc: `Analyst ${analyst} recorded a new investigation note.`
                  }]
                }
              : c
          )
        })),
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
          alerts: [],
          cases: [],
        }),
    }),
    {
      name: 'healthcare-saas-store',
      partialize: (state) => ({
        theme: state.theme,
        auth: state.auth,
        sidebarCollapsed: state.sidebarCollapsed,
        alerts: state.alerts,
        cases: state.cases,
      }),
    },
  ),
)
