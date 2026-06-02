import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { healthcareApi } from '@/services/api'
import toast from 'react-hot-toast'

const mapBackendDoc = (d) => ({
  id: d.id || d.document_id,
  fileName: d.fileName || d.file_name,
  fileType: d.fileType || d.file_type,
  fileSize: d.fileSize || d.file_size,
  uploaded_by: d.uploaded_by,
  created_at: d.created_at || d.uploaded_at,
  status: d.status,
  riskLevel: d.riskLevel || d.risk_level,
  patientName: d.patientName !== undefined ? d.patientName : d.patient_name,
  providerName: d.providerName !== undefined ? d.providerName : d.provider_name,
  claimAmount: d.claimAmount !== undefined ? d.claimAmount : d.claim_amount,
  dateOfService: d.dateOfService !== undefined ? d.dateOfService : d.date_of_service,
  diagnosisCode: d.diagnosisCode !== undefined ? d.diagnosisCode : d.diagnosis_code,
  procedureCode: d.procedureCode !== undefined ? d.procedureCode : d.procedure_code,
  notes: (d.notes || []).map(n => ({
    text: n.text,
    date: n.date,
    analyst: n.analyst
  }))
})

const mapBackendVerification = (d) => {
  const v = d.verification
  if (!v) return null
  
  let trustRating = 'Excellent'
  if (v.verification_score >= 90) trustRating = 'Excellent'
  else if (v.verification_score >= 50) trustRating = 'Good'
  else trustRating = 'Suspicious'
  
  return {
    docId: d.id || d.document_id,
    score: v.verification_score,
    trustRating: trustRating,
    mismatchCount: v.mismatch_count,
    checks: {
      nameMatch: v.checks?.nameMatch,
      providerMatch: v.checks?.providerMatch,
      amountMatch: v.checks?.amountMatch,
      dateMatch: v.checks?.dateMatch
    },
    claimValues: {
      patientName: v.claim_values?.patientName || v.claim_values?.patient_name,
      providerName: v.claim_values?.providerName || v.claim_values?.provider_name,
      claimAmount: v.claim_values?.claimAmount || v.claim_values?.claim_amount,
      dateOfService: v.claim_values?.dateOfService || v.claim_values?.date_of_service
    }
  }
}

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
      fetchDocuments: async (params) => {
        try {
          const response = await healthcareApi.getDocuments(params)
          if (response && response.data) {
            const docs = response.data.map(mapBackendDoc)
            const verificationResults = response.data.map(mapBackendVerification).filter(Boolean)
            set({ documents: docs, verificationResults })
          }
        } catch (error) {
          console.error("Failed to fetch documents from backend:", error)
        }
      },
      uploadDocument: async (file) => {
        try {
          const response = await healthcareApi.uploadDocument(file)
          if (response && response.data) {
            const d = response.data
            const mappedDoc = mapBackendDoc(d)
            const mappedVer = mapBackendVerification(d)
            
            set((state) => {
              const nextDocs = [mappedDoc, ...state.documents.filter(x => x.id !== mappedDoc.id)]
              const nextResults = mappedVer 
                ? [mappedVer, ...state.verificationResults.filter(x => x.docId !== mappedDoc.id)]
                : state.verificationResults
              return { documents: nextDocs, verificationResults: nextResults }
            })
            return mappedDoc
          }
        } catch (error) {
          console.error("Failed to upload document to backend:", error)
          toast.error("Failed to upload document: " + (error.response?.data?.detail || error.message))
        }
      },
      addVerificationNote: async (docId, text, analyst = 'Analyst') => {
        if (!text || !text.trim()) {
          toast.error('Please enter a note before submitting.')
          return
        }
        try {
          const response = await healthcareApi.addDocumentNote(docId, text)
          if (response && response.data) {
            const updatedDoc = mapBackendDoc(response.data)
            set((state) => ({
              documents: state.documents.map((d) => (d.id === docId ? updatedDoc : d))
            }))
          }
        } catch (error) {
          console.error("Failed to add note to document on backend:", error)
          toast.error("Failed to save note: " + (error.response?.data?.detail || error.message))
        }
      },
      deleteDocument: async (docId) => {
        try {
          await healthcareApi.deleteDocument(docId)
          set((state) => ({
            documents: state.documents.filter((d) => d.id !== docId),
            verificationResults: state.verificationResults.filter((r) => r.docId !== docId),
          }))
        } catch (error) {
          console.error("Failed to delete document from backend:", error)
          toast.error("Failed to delete document: " + (error.response?.data?.detail || error.message))
        }
      },
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
