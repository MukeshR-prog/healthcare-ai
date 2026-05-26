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
      providerWatchlist: [],
      providerFlags: {},
      documents: [],
      verificationResults: [],
      networkAnnotations: {},
      savedNetworkViews: [],
      copilotChats: [],
      copilotSuggestions: [
        'Which provider has the highest fraud risk?',
        'Show critical investigations.',
        'Summarize recent alerts.',
        'Explain Provider B risk score.',
        'Show document verification mismatches.'
      ],
      savedQueries: [],
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
      toggleWatchlist: (providerName) =>
        set((state) => {
          const inList = state.providerWatchlist.includes(providerName)
          const nextList = inList
            ? state.providerWatchlist.filter((name) => name !== providerName)
            : [...state.providerWatchlist, providerName]
          return { providerWatchlist: nextList }
        }),
      setProviderFlag: (providerName, flagText) =>
        set((state) => ({
          providerFlags: {
            ...state.providerFlags,
            [providerName]: flagText,
          },
        })),
      addDocument: (doc) =>
        set((state) => ({
          documents: [doc, ...state.documents],
        })),
      updateVerification: (docId, status, results) =>
        set((state) => {
          const nextDocs = state.documents.map((d) =>
            d.id === docId ? { ...d, status, updated_at: new Date().toISOString() } : d
          )
          const exists = state.verificationResults.some((r) => r.docId === docId)
          const nextResults = exists
            ? state.verificationResults.map((r) =>
                r.docId === docId
                  ? { ...r, ...results, updated_at: new Date().toISOString() }
                  : r
              )
            : [
                ...state.verificationResults,
                {
                  docId,
                  ...results,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              ]
          return { documents: nextDocs, verificationResults: nextResults }
        }),
      addVerificationNote: (docId, text, analyst = 'Analyst') =>
        set((state) => {
          const nextDocs = state.documents.map((d) =>
            d.id === docId
              ? {
                  ...d,
                  notes: [...(d.notes || []), { text, date: new Date().toISOString(), analyst }],
                  updated_at: new Date().toISOString(),
                }
              : d
          )
          return { documents: nextDocs }
        }),
      deleteDocument: (docId) =>
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== docId),
          verificationResults: state.verificationResults.filter((r) => r.docId !== docId),
        })),
      saveNetworkView: (view) =>
        set((state) => ({
          savedNetworkViews: [view, ...state.savedNetworkViews],
        })),
      addNetworkAnnotation: (entityId, notesText) =>
        set((state) => ({
          networkAnnotations: {
            ...state.networkAnnotations,
            [entityId]: notesText,
          },
        })),
      deleteNetworkAnnotation: (entityId) =>
        set((state) => {
          const next = { ...state.networkAnnotations }
          delete next[entityId]
          return { networkAnnotations: next }
        }),
      sendCopilotMessage: (message) =>
        set((state) => ({
          copilotChats: [...state.copilotChats, message],
        })),
      saveCopilotQuery: (query) =>
        set((state) => {
          const exists = state.savedQueries.some((q) => q.text === query.text)
          if (exists) return {}
          return { savedQueries: [query, ...state.savedQueries] }
        }),
      clearCopilotHistory: () => set({ copilotChats: [] }),
      pinCopilotResponse: (messageId) =>
        set((state) => ({
          copilotChats: state.copilotChats.map((c) =>
            c.id === messageId ? { ...c, isPinned: !c.isPinned } : c
          ),
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
          providerWatchlist: [],
          providerFlags: {},
          documents: [],
          verificationResults: [],
          networkAnnotations: {},
          savedNetworkViews: [],
          copilotChats: [],
          savedQueries: [],
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
        providerWatchlist: state.providerWatchlist,
        providerFlags: state.providerFlags,
        documents: state.documents,
        verificationResults: state.verificationResults,
        networkAnnotations: state.networkAnnotations,
        savedNetworkViews: state.savedNetworkViews,
        copilotChats: state.copilotChats,
        savedQueries: state.savedQueries,
      }),
    },
  ),
)
