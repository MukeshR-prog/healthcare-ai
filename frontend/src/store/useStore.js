import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { healthcareApi } from '@/services/api'
import toast from 'react-hot-toast'

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
      providers: [],
      providerMetrics: null,
      providerTrends: [],
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
      reports: [],
      reportTemplates: [],
      auditLogs: [],
      setTheme: (theme) => set({ theme }),
      setLoading: (loading) => set({ loading }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
      setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
      setAlerts: (alerts) => set({ alerts }),
      updateAlertStatus: async (alertId, status) => {
        try {
          await healthcareApi.updateAlertStatus(alertId, status)
          set((state) => ({
            alerts: state.alerts.map((a) => (a.id === alertId ? { ...a, status } : a)),
          }))
        } catch (error) {
          console.error("Failed to update status on backend:", error)
        }
      },
      updateAlertNotes: async (alertId, text) => {
        if (!text || !text.trim()) {
          toast.error('Please enter a note before saving.')
          return
        }
        try {
          const alert = useStore.getState().alerts.find(a => a.id === alertId)
          const oldText = alert ? alert.notes : ''
          
          let noteToAppend = text
          if (oldText && text.startsWith(oldText)) {
            noteToAppend = text.slice(oldText.length).trim()
          }
          
          if (noteToAppend) {
            await healthcareApi.addAlertNote(alertId, noteToAppend)
          }
          
          set((state) => ({
            alerts: state.alerts.map((a) => (a.id === alertId ? { ...a, notes: text } : a)),
          }))
          toast.success('Note updated successfully!')
        } catch (error) {
          console.error("Failed to add note on backend:", error)
          toast.error('Failed to save note: ' + (error.response?.data?.detail || error.message))
        }
      },
      setCases: (cases) => set({ cases }),
      createCase: async (alertItem, analystName = 'Unassigned', priority = 'Medium') => {
        try {
          const exists = useStore.getState().cases.some((c) => c.alertId === alertItem.id || c.claimId === alertItem.claimId)
          if (exists) return

          const response = await healthcareApi.createCase({
            alert_id: alertItem.id,
            assigned_to: analystName,
            priority: priority
          })

          if (response) {
            const newItem = response.data
            const mappedCase = {
              id: newItem.id || newItem._id,
              caseId: newItem.case_id,
              alertId: newItem.alert_id,
              claimId: newItem.claim_id,
              provider: newItem.provider,
              amount: newItem.amount || newItem.claim_amount || 0,
              riskScore: newItem.riskScore || newItem.risk_score || 0,
              severity: newItem.severity,
              status: newItem.status,
              priority: newItem.priority,
              assignedTo: newItem.assignedTo || newItem.assigned_to,
              created_at: newItem.created_at,
              updated_at: newItem.updated_at,
              created_by: newItem.created_by,
              notes: (newItem.notes || []).map(n => ({
                analyst: n.analyst || n.author,
                text: n.text || n.note,
                date: n.date || n.created_at
              })),
              timeline: (newItem.timeline || []).map(t => ({
                title: t.title || t.event_type,
                desc: t.desc || t.description,
                date: t.date || t.created_at,
                status: t.status || t.event_type || 'New'
              }))
            }
            set((state) => ({ cases: [mappedCase, ...state.cases] }))
          }
        } catch (error) {
          console.error("Failed to create case on backend:", error)
        }
      },
      updateCaseStatus: async (caseId, status, desc = '') => {
        try {
          const response = await healthcareApi.updateCaseStatus(caseId, status, desc)
          if (response) {
            const newItem = response.data
            set((state) => ({
              cases: state.cases.map((c) => (c.id === caseId ? {
                ...c,
                status: newItem.status,
                updated_at: newItem.updated_at,
                timeline: (newItem.timeline || []).map(t => ({
                  title: t.title || t.event_type,
                  desc: t.desc || t.description,
                  date: t.date || t.created_at,
                  status: t.status || t.event_type || 'New'
                }))
              } : c))
            }))
          }
        } catch (error) {
          console.error("Failed to update status on backend:", error)
        }
      },
      updateCaseAssignment: async (caseId, assignedTo, priority) => {
        try {
          const response = await healthcareApi.updateCaseAssignment(caseId, assignedTo, priority)
          if (response) {
            const newItem = response.data
            set((state) => ({
              cases: state.cases.map((c) => (c.id === caseId ? {
                ...c,
                assignedTo: newItem.assigned_to || newItem.assignedTo,
                priority: newItem.priority,
                updated_at: newItem.updated_at,
                timeline: (newItem.timeline || []).map(t => ({
                  title: t.title || t.event_type,
                  desc: t.desc || t.description,
                  date: t.date || t.created_at,
                  status: t.status || t.event_type || 'New'
                }))
              } : c))
            }))
          }
        } catch (error) {
          console.error("Failed to update assignment on backend:", error)
        }
      },
      addCaseNote: async (caseId, text, analyst = 'Analyst') => {
        if (!text || !text.trim()) {
          toast.error('Please enter a note before submitting.')
          return
        }
        try {
          const response = await healthcareApi.addCaseNote(caseId, text)
          if (response) {
            const newItem = response.data
            set((state) => ({
              cases: state.cases.map((c) => (c.id === caseId ? {
                ...c,
                updated_at: newItem.updated_at,
                notes: (newItem.notes || []).map(n => ({
                  analyst: n.analyst || n.author,
                  text: n.text || n.note,
                  date: n.date || n.created_at
                })),
                timeline: (newItem.timeline || []).map(t => ({
                  title: t.title || t.event_type,
                  desc: t.desc || t.description,
                  date: t.date || t.created_at,
                  status: t.status || t.event_type || 'New'
                }))
              } : c))
            }))
            toast.success('Note added successfully!')
          }
        } catch (error) {
          console.error("Failed to add note on backend:", error)
          toast.error('Failed to add note: ' + (error.response?.data?.detail || error.message))
        }
      },
      toggleWatchlist: async (providerName) => {
        try {
          const state = useStore.getState()
          const provider = state.providers.find(p => p.name === providerName)
          const currentWatchlisted = provider ? provider.watchlist : false
          const nextWatchlisted = !currentWatchlisted
          
          await healthcareApi.updateProviderWatchlist(providerName, nextWatchlisted)
          
          set((state) => ({
            providers: state.providers.map((p) => p.name === providerName ? { ...p, watchlist: nextWatchlisted } : p)
          }))
        } catch (error) {
          console.error("Failed to toggle watchlist on backend:", error)
        }
      },
      setProviderFlag: async (providerName, flagText) => {
        try {
          await healthcareApi.updateProviderFlag(providerName, flagText)
          set((state) => ({
            providers: state.providers.map((p) => p.name === providerName ? { ...p, flag: flagText } : p)
          }))
        } catch (error) {
          console.error("Failed to save provider flag on backend:", error)
        }
      },
      fetchProviders: async (params) => {
        try {
          const response = await healthcareApi.getProviders(params)
          if (response) {
            set({ providers: response.data })
          }
        } catch (error) {
          console.error("Failed to fetch providers from backend:", error)
        }
      },
      fetchProviderMetrics: async () => {
        try {
          const response = await healthcareApi.getProviderMetrics()
          if (response) {
            set({ providerMetrics: response.data })
          }
        } catch (error) {
          console.error("Failed to fetch provider metrics from backend:", error)
        }
      },
      fetchProviderTrends: async () => {
        try {
          const response = await healthcareApi.getProviderTrends()
          if (response) {
            set({ providerTrends: response.data })
          }
        } catch (error) {
          console.error("Failed to fetch provider trends from backend:", error)
        }
      },
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
      createReport: (report) =>
        set((state) => ({
          reports: [report, ...state.reports],
        })),
      deleteReport: (id) =>
        set((state) => ({
          reports: state.reports.filter((r) => r.id !== id),
        })),
      duplicateReport: (id) =>
        set((state) => {
          const target = state.reports.find((r) => r.id === id)
          if (!target) return {}
          const duplicate = {
            ...target,
            id: `REP-${Date.now()}`,
            title: `${target.title} (Copy)`,
            date: new Date().toISOString(),
          }
          return { reports: [duplicate, ...state.reports] }
        }),
      saveTemplate: (template) =>
        set((state) => ({
          reportTemplates: [template, ...state.reportTemplates],
        })),
      createAuditLog: (log) =>
        set((state) => ({
          auditLogs: [log, ...state.auditLogs],
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
          reports: [],
          reportTemplates: [],
          auditLogs: [],
        }),
    }),
    {
      name: 'healthcare-saas-store',
      partialize: (state) => ({
        theme: state.theme,
        auth: state.auth,
        sidebarCollapsed: state.sidebarCollapsed,
        documents: state.documents,
        verificationResults: state.verificationResults,
        networkAnnotations: state.networkAnnotations,
        savedNetworkViews: state.savedNetworkViews,
        copilotChats: state.copilotChats,
        savedQueries: state.savedQueries,
        reports: state.reports,
        reportTemplates: state.reportTemplates,
        auditLogs: state.auditLogs,
      }),
    },
  ),
)
