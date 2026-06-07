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
      explanations: [],
      activeExplanation: null,
      activeFeatures: [],
      activeInsights: null,
      explanationMetrics: null,
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
      schedules: [],
      dashboardMetrics: null,
      copilotConversations: [],
      activeConversationId: null,
      copilotMetrics: null,
      ragStats: null,
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
      fetchExplanations: async (params) => {
        try {
          const response = await healthcareApi.getExplanations(params)
          if (response && response.data) {
            set({ explanations: response.data })
          }
        } catch (error) {
          console.error("Failed to fetch explanations:", error)
        }
      },
      fetchExplanationDetails: async (predictionId) => {
        try {
          set({ activeFeatures: [], activeExplanation: null, activeInsights: null })
          
          const [expRes, featRes, insRes] = await Promise.allSettled([
            healthcareApi.getExplanationDetail(predictionId),
            healthcareApi.getExplanationFeatures(predictionId),
            healthcareApi.getExplanationInsights(predictionId)
          ])
          
          const newState = {}
          if (expRes.status === 'fulfilled' && expRes.value) {
            newState.activeExplanation = expRes.value.data
          }
          if (featRes.status === 'fulfilled' && featRes.value) {
            newState.activeFeatures = featRes.value.data.map(f => ({
              name: f.featureName,
              value: f.contributionScore,
              rawValue: f.featureValue,
              direction: f.direction,
              desc: f.featureName === 'Claim Amount' ? (parseFloat(f.featureValue.replace(/[$,]/g, '')) > 10000 ? 'Outlier Billing Band' : 'Normal Range') :
                    f.featureName === 'Provider Billing Frequency' ? (f.featureValue.includes('Provider B') || f.featureValue.includes('Provider C') ? 'Elevated Provider Infraction Rate' : 'Low Baseline Provider Risk') :
                    f.featureName === 'Number of Procedures' ? (parseInt(f.featureValue) > 3 ? 'Excessive Single-Visit Procedures' : 'Standard Procedure Volume') :
                    f.featureName === 'Age Demographic Outlier' ? ((parseInt(f.featureValue) > 65 || parseInt(f.featureValue) < 25) ? 'High-Risk Demographic Bracket' : 'Average Risk Cohort') :
                    (f.direction === 'positive' ? 'Elevated Historic Recurrence' : 'Clean Profile History')
            }))
          }
          if (insRes.status === 'fulfilled' && insRes.value) {
            newState.activeInsights = insRes.value.data
          }
          
          set(newState)
        } catch (error) {
          console.error("Failed to fetch explanation details:", error)
        }
      },
      fetchExplanationMetrics: async () => {
        try {
          const response = await healthcareApi.getExplanationMetrics()
          if (response && response.data) {
            set({ explanationMetrics: response.data })
          }
        } catch (error) {
          console.error("Failed to fetch explanation metrics:", error)
        }
      },
      triggerExplanationSync: async () => {
        try {
          const response = await healthcareApi.syncExplanations()
          if (response && response.data) {
            toast.success(`Synced ${response.data.synced_count} predictions successfully!`)
            return response.data
          }
        } catch (error) {
          console.error("Failed to sync explanations:", error)
          toast.error("Failed to sync explanations.")
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
      sendCopilotMessage: async (query) => {
        try {
          const state = get()
          const conversationId = state.activeConversationId
          
          // Append temporary user message
          const tempUserMsg = {
            id: `msg-${Date.now()}-user`,
            sender: 'user',
            text: query,
            timestamp: new Date().toISOString(),
            isPinned: false
          }
          set((state) => ({
            copilotChats: [...state.copilotChats, tempUserMsg]
          }))

          const response = await healthcareApi.sendCopilotMessage({
            message: query,
            conversationId: conversationId
          })
          
          if (response && response.data) {
            const { conversationId: newConvId, response: assistantMsg } = response.data
            const mappedAssistantMsg = {
              id: assistantMsg.id || assistantMsg._id,
              sender: assistantMsg.sender,
              text: assistantMsg.text,
              timestamp: assistantMsg.timestamp,
              isPinned: assistantMsg.is_pinned || assistantMsg.isPinned,
              recommendations: assistantMsg.recommendations || [],
              insightData: assistantMsg.insightData || {}
            }
            
            set((state) => ({
              activeConversationId: newConvId,
              copilotChats: [...state.copilotChats, mappedAssistantMsg]
            }))
            
            // Reload list and metrics
            useStore.getState().fetchCopilotConversations()
            useStore.getState().fetchCopilotMetrics()
            
            return { conversationId: newConvId, response: mappedAssistantMsg }
          }
        } catch (error) {
          console.error("Failed to send copilot message:", error)
        }
      },
      fetchCopilotConversations: async () => {
        try {
          const res = await healthcareApi.getCopilotConversations()
          set({ copilotConversations: res.data })
        } catch (err) {
          console.error("Failed to fetch copilot conversations:", err)
        }
      },
      fetchCopilotMessages: async (conversationId) => {
        try {
          const res = await healthcareApi.getCopilotMessages(conversationId)
          const mappedMsgs = res.data.map(msg => ({
            id: msg.id || msg._id,
            sender: msg.sender,
            text: msg.text,
            timestamp: msg.timestamp,
            isPinned: msg.is_pinned || msg.isPinned,
            recommendations: msg.recommendations || [],
            insightData: msg.insightData || {}
          }))
          set({
            copilotChats: mappedMsgs,
            activeConversationId: conversationId
          })
        } catch (err) {
          console.error("Failed to fetch copilot messages:", err)
        }
      },
      deleteCopilotConversation: async (conversationId) => {
        try {
          await healthcareApi.deleteCopilotConversation(conversationId)
          set((state) => {
            const nextConvs = state.copilotConversations.filter(c => c.conversationId !== conversationId)
            const isCurrent = state.activeConversationId === conversationId
            return {
              copilotConversations: nextConvs,
              activeConversationId: isCurrent ? null : state.activeConversationId,
              copilotChats: isCurrent ? [] : state.copilotChats
            }
          })
          toast.success("Conversation deleted.")
          useStore.getState().fetchCopilotMetrics()
        } catch (err) {
          console.error("Failed to delete copilot conversation:", err)
        }
      },
      fetchCopilotSuggestions: async () => {
        try {
          const res = await healthcareApi.getCopilotSuggestions()
          set({ copilotSuggestions: res.data })
        } catch (err) {
          console.error("Failed to fetch copilot suggestions:", err)
        }
      },
      fetchCopilotMetrics: async () => {
        try {
          const res = await healthcareApi.getCopilotMetrics()
          set({ copilotMetrics: res.data })
        } catch (err) {
          console.error("Failed to fetch copilot metrics:", err)
        }
      },
      saveCopilotQuery: (query) =>
        set((state) => {
          const exists = state.savedQueries.some((q) => q.text === query.text)
          if (exists) return {}
          return { savedQueries: [query, ...state.savedQueries] }
        }),
      clearCopilotHistory: () => set({ copilotChats: [], activeConversationId: null }),
       pinCopilotResponse: (messageId) =>
        set((state) => ({
          copilotChats: state.copilotChats.map((c) =>
            c.id === messageId ? { ...c, isPinned: !c.isPinned } : c
          ),
        })),
      fetchRAGStats: async () => {
        try {
          const res = await healthcareApi.ragStats()
          set({ ragStats: res.data })
        } catch (err) {
          console.error("Failed to fetch RAG stats:", err)
        }
      },
      reindexRAG: async () => {
        try {
          toast.loading("Reindexing RAG Knowledge Base...")
          const res = await healthcareApi.ragReindex()
          set({ ragStats: res.data })
          toast.dismiss()
          toast.success("RAG Knowledge Base reindexed successfully!")
        } catch (err) {
          toast.dismiss()
          console.error("Failed to reindex RAG:", err)
          toast.error("Failed to reindex RAG Knowledge Base.")
        }
      },
      fetchReports: async () => {
        try {
          const res = await healthcareApi.getReports()
          set({ reports: res.data })
        } catch (err) {
          console.error("Failed to fetch reports:", err)
        }
      },
      fetchTemplates: async () => {
        try {
          const res = await healthcareApi.getTemplates()
          set({ reportTemplates: res.data })
        } catch (err) {
          console.error("Failed to fetch templates:", err)
        }
      },
      fetchComplianceMetrics: async () => {
        try {
          const res = await healthcareApi.getComplianceMetrics()
          set({ complianceMetrics: res.data })
          return res.data
        } catch (err) {
          console.error("Failed to fetch compliance metrics:", err)
        }
      },
      fetchAuditLogs: async () => {
        try {
          // Check role first: only allowed for Admin, Auditor, Senior Analyst
          const role = get().auth?.user?.role
          if (role && ["Admin", "Auditor", "Senior Analyst"].includes(role)) {
            const res = await healthcareApi.getAuditLogs()
            // Map backend audit log fields to what Reports.jsx expects:
            // id, action, details, date, analyst
            const mapped = res.data.map(log => ({
              id: log.id || log._id,
              action: log.event_type || log.eventType || "Event",
              details: log.description || "",
              date: log.created_at || log.createdAt || new Date().toISOString(),
              analyst: log.performed_by || log.performedBy || "system"
            }))
            set({ auditLogs: mapped })
          }
        } catch (err) {
          console.error("Failed to fetch audit logs:", err)
        }
      },
      createReport: async (reportPayload) => {
        try {
          const res = await healthcareApi.generateReport(reportPayload)
          set((state) => ({
            reports: [res.data, ...state.reports],
          }))
          return res.data
        } catch (err) {
          console.error("Failed to generate report:", err)
        }
      },
      deleteReport: async (id) => {
        try {
          await healthcareApi.deleteReport(id)
          set((state) => ({
            reports: state.reports.filter((r) => r.id !== id && r.reportId !== id),
          }))
        } catch (err) {
          console.error("Failed to delete report:", err)
        }
      },
      duplicateReport: async (id) => {
        try {
          const state = get()
          const target = state.reports.find((r) => r.id === id || r.reportId === id)
          if (!target) return
          // target filters has timeRange
          const timeRange = target.filters?.timeRange || "Last 30 Days"
          const res = await healthcareApi.generateReport({
            title: `${target.title} (Copy)`,
            reportType: target.reportType || target.type,
            timeRange: timeRange
          })
          set((state) => ({
            reports: [res.data, ...state.reports],
          }))
        } catch (err) {
          console.error("Failed to duplicate report:", err)
        }
      },
      saveTemplate: async (templatePayload) => {
        try {
          const res = await healthcareApi.saveTemplate(templatePayload)
          set((state) => ({
            reportTemplates: [res.data, ...state.reportTemplates],
          }))
        } catch (err) {
          console.error("Failed to save template:", err)
        }
      },
      fetchSchedules: async () => {
        try {
          const res = await healthcareApi.getSchedules()
          set({ schedules: res.data })
        } catch (err) {
          console.error("Failed to fetch schedules:", err)
        }
      },
      createSchedule: async (schedulePayload) => {
        try {
          const res = await healthcareApi.createSchedule(schedulePayload)
          set((state) => ({
            schedules: [res.data, ...state.schedules],
          }))
          return res.data
        } catch (err) {
          console.error("Failed to create schedule:", err)
        }
      },
      fetchDashboardMetrics: async () => {
        try {
          const res = await healthcareApi.getDashboardMetrics()
          set({ dashboardMetrics: res.data })
          return res.data
        } catch (err) {
          console.error("Failed to fetch dashboard metrics:", err)
        }
      },
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
