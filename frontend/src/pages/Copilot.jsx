import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  Send,
  Sparkles,
  Bookmark,
  Trash2,
  Download,
  Printer,
  X,
  User,
  CheckCircle,
  AlertTriangle,
  Layers,
  ChevronRight,
  Clipboard,
  FileText,
  Activity,
  ShieldAlert,
  Clock,
  Pin,
  BookmarkCheck,
  Check,
  Plus,
  RefreshCw,
  Info
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useApi } from '@/hooks/useApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import toast from 'react-hot-toast'
import { cn } from '@/utils/cn'

// Inline currency & percent formatters
const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
const formatPercent = (val) =>
  new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(val)

export default function Copilot() {
  const alerts = useStore((state) => state.alerts || [])
  const cases = useStore((state) => state.cases || [])
  const documents = useStore((state) => state.documents || [])
  const history = useStore((state) => state.history || [])
  const providerWatchlist = useStore((state) => state.providerWatchlist || [])
  const providerFlags = useStore((state) => state.providerFlags || {})
  
  const copilotChats = useStore((state) => state.copilotChats || [])
  const copilotSuggestions = useStore((state) => state.copilotSuggestions || [])
  const savedQueries = useStore((state) => state.savedQueries || [])
  
  const sendCopilotMessage = useStore((state) => state.sendCopilotMessage)
  const saveCopilotQuery = useStore((state) => state.saveCopilotQuery)
  const clearCopilotHistory = useStore((state) => state.clearCopilotHistory)
  const pinCopilotResponse = useStore((state) => state.pinCopilotResponse)

  const copilotConversations = useStore((state) => state.copilotConversations || [])
  const activeConversationId = useStore((state) => state.activeConversationId)
  const copilotMetrics = useStore((state) => state.copilotMetrics)
  const fetchCopilotConversations = useStore((state) => state.fetchCopilotConversations)
  const fetchCopilotMessages = useStore((state) => state.fetchCopilotMessages)
  const deleteCopilotConversation = useStore((state) => state.deleteCopilotConversation)
  const fetchCopilotSuggestions = useStore((state) => state.fetchCopilotSuggestions)
  const fetchCopilotMetrics = useStore((state) => state.fetchCopilotMetrics)
  const user = useStore((state) => state.auth?.user)
  const ragStats = useStore((state) => state.ragStats)
  const fetchRAGStats = useStore((state) => state.fetchRAGStats)
  const reindexRAG = useStore((state) => state.reindexRAG)

  const { fetchHistory } = useApi()

  // State Variables
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [activeTab, setActiveTab] = useState('insights') // insights, saved, summarizer, recommendations
  
  const chatEndRef = useRef(null)

  // Initial fetch on mount
  useEffect(() => {
    fetchHistory()
    fetchCopilotConversations()
    fetchCopilotSuggestions()
    fetchCopilotMetrics()
    fetchRAGStats()
  }, [fetchHistory, fetchCopilotConversations, fetchCopilotSuggestions, fetchCopilotMetrics, fetchRAGStats])

  // Scroll to bottom on chats updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [copilotChats, isTyping])



  // Compute live contextual analytics
  const copilotContext = useMemo(() => {
    // Top Providers Risk
    const providersMap = {}
    history.forEach((h) => {
      const p = h.claim?.provider
      if (!p) return
      if (!providersMap[p]) {
        providersMap[p] = { name: p, claims: 0, amount: 0, fraudCount: 0 }
      }
      providersMap[p].claims++
      providersMap[p].amount += h.claim.claim_amount || 0
      if (h.latest_prediction?.prediction === 1) {
        providersMap[p].fraudCount++
      }
    })

    const topProviders = Object.values(providersMap)
      .map((p) => {
        const watchlist = providerWatchlist.includes(p.name)
        const rate = p.claims > 0 ? p.fraudCount / p.claims : 0
        const score = Math.round(rate * 100 * 0.5 + (watchlist ? 30 : 0) + (p.fraudCount > 2 ? 20 : 0))
        return { ...p, score }
      })
      .sort((a, b) => b.score - a.score)

    // Critical Alerts
    const criticalAlerts = alerts.filter((a) => a.severity === 'Critical')
    
    // Open Investigations
    const openCases = cases.filter((c) => c.status !== 'Closed')

    // Document Verification Issues
    const mismatchDocs = documents.filter((d) => d.status === 'Mismatch')

    return {
      topProviders,
      criticalAlerts,
      openCases,
      mismatchDocs,
      totalQueries: copilotChats.filter((c) => c.sender === 'user').length
    }
  }, [history, alerts, cases, documents, providerWatchlist])

  // Handle Send Message
  const handleSendMessage = async (text = inputValue) => {
    if (!text.trim()) return

    setInputValue('')
    setIsTyping(true)
    try {
      await sendCopilotMessage(text.trim())
    } catch (err) {
      console.error("Failed to send message:", err)
    } finally {
      setIsTyping(false)
    }
  }

  // Handle Enter Key Press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  // Automated Investigation Case Summary compiler
  const compiledCaseSummary = useMemo(() => {
    if (!selectedCaseId) return null
    const c = cases.find((item) => item.id === selectedCaseId)
    if (!c) return null

    const noteTexts = c.notes?.map((n) => `[${new Date(n.date).toLocaleDateString()}] Analyst ${n.analyst}: ${n.text}`).join('\n') || 'No analyst notes.'
    const timelineLogs = c.timeline?.map((t) => `- [${new Date(t.date).toLocaleDateString()}] ${t.title}: ${t.desc}`).join('\n') || 'No timeline records.'

    return `# Platform Case Summary: ${c.id}
Generated: ${new Date().toLocaleString()}

### Case Identity
- **Provider**: ${c.provider}
- **Assigned investigator**: ${c.assignedTo}
- **Priority rating**: ${c.priority}
- **Current status**: ${c.status}
- **Claim reference amount**: ${formatCurrency(c.amount)}
- **Composite risk confidence**: ${c.riskScore}%

### Timeline Events
${timelineLogs}

### Analyst Review Logs
${noteTexts}

***
Executive Recommendation: ${c.priority === 'Critical' || c.priority === 'High' ? 'Flagged for immediate medical director sign-off.' : 'Retain on standard audit status monitoring.'}`
  }, [selectedCaseId, cases])

  // Save / Bookmark Query
  const handleSaveQuery = (text) => {
    if (!text.trim()) return
    saveCopilotQuery({
      id: `q-${Date.now()}`,
      text: text.trim(),
      date: new Date().toISOString()
    })
    toast.success('Query bookmarked successfully!')
  }

  // Pin message
  const handleTogglePin = (msgId) => {
    pinCopilotResponse(msgId)
    toast.success('Response pin toggled!')
  }

  // Exporters
  const handleExportChat = () => {
    if (copilotChats.length === 0) return
    const textLog = copilotChats
      .map((c) => `[${new Date(c.timestamp).toLocaleString()}] ${c.sender.toUpperCase()}: ${c.text}`)
      .join('\n\n')

    const blob = new Blob([textLog], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `AI_Copilot_Chat_Export_${new Date().toISOString().split('T')[0]}.txt`)
    link.click()
  }

  const handleExportSummary = () => {
    if (!compiledCaseSummary) return
    const blob = new Blob([compiledCaseSummary], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Investigation_Summary_${selectedCaseId}.md`)
    link.click()
  }

  return (
    <section className='space-y-6 select-none'>
      {/* Print media stylesheet */}
      <style>{`
        @media print {
          aside, nav, header, .no-print, button, select, input, .suggestion-bar {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-area {
            display: block !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* Banner / Header (No-print) */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-[linear-gradient(to_right,#e0f2fe,#eef2ff,#ffffff)] p-5 shadow-xs dark:border-slate-800/80 dark:bg-[linear-gradient(to_right,rgba(14,165,233,0.1),rgba(99,102,241,0.1),rgba(2,6,23,0.7))] no-print'>
        <div>
          <p className='text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1.5'>
            <Bot className='h-4 w-4 text-sky-500 animate-bounce' />
            Context-Aware Copilot Observatory
          </p>
          <h2 className='mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white'>
            AI Fraud Copilot Center
          </h2>
          <p className='mt-1 text-sm text-slate-600 dark:text-slate-350 max-w-4xl'>
            Query platform statistics using natural language, compile auto-investigation summaries, analyze upcoding fraud alerts, and receive operational audit recommendations.
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2 self-center shrink-0'>
          <div className='flex items-center gap-1.5'>
            <select
              value={activeConversationId || ''}
              onChange={(e) => {
                const val = e.target.value
                if (val) {
                  fetchCopilotMessages(val)
                } else {
                  clearCopilotHistory()
                }
              }}
              className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-850 transition shadow-xs outline-hidden'
            >
              <option value=''>-- New Conversation --</option>
              {copilotConversations.map((conv) => (
                <option key={conv.conversationId} value={conv.conversationId}>
                  {conv.title || `Chat ${conv.conversationId.slice(0, 8)}...`}
                </option>
              ))}
            </select>
            {activeConversationId && (
              <button
                type='button'
                onClick={() => {
                  if (confirm("Are you sure you want to delete this conversation?")) {
                    deleteCopilotConversation(activeConversationId)
                  }
                }}
                className='inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-850 transition shadow-xs'
                title='Delete Active Conversation'
              >
                <Trash2 className='h-3.5 w-3.5' />
              </button>
            )}
          </div>
          <button
            type='button'
            onClick={handleExportChat}
            className='inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-850 transition shadow-xs'
          >
            <Download className='h-3.5 w-3.5' /> Export Conversation
          </button>
          <button
            type='button'
            onClick={() => window.print()}
            className='inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-sky-700 transition shadow-xs'
          >
            <Printer className='h-3.5 w-3.5' /> Print PDF Report
          </button>
        </div>
      </div>

      {/* Copilot Overview KPIs (No-print) */}
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4 no-print'>
        <div className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950/80'>
          <div className='flex items-center justify-between'>
            <p className='text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-550'>Total Queries</p>
            <div className='grid h-8 w-8 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400'>
              <Sparkles className='h-4 w-4 animate-pulse' />
            </div>
          </div>
          <p className='font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mt-3'>
            {copilotMetrics?.totalQueries ?? 0}
          </p>
          <p className='text-[10px] text-slate-400 font-semibold mt-1.5'>Conversations recorded this session</p>
        </div>

        <div className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950/80'>
          <div className='flex items-center justify-between'>
            <p className='text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-550'>Pinned Insights</p>
            <div className='grid h-8 w-8 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'>
              <Pin className='h-4 w-4' />
            </div>
          </div>
          <p className='font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mt-3'>
            {copilotMetrics?.pinnedInsights ?? 0}
          </p>
          <p className='text-[10px] text-slate-400 font-semibold mt-1.5'>Flagged key-knowledge items</p>
        </div>

        <div className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950/80'>
          <div className='flex items-center justify-between'>
            <p className='text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-550'>Open Investigations</p>
            <div className='grid h-8 w-8 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400'>
              <Layers className='h-4 w-4' />
            </div>
          </div>
          <p className='font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mt-3'>
            {copilotMetrics?.openInvestigations ?? 0}
          </p>
          <p className='text-[10px] text-slate-400 font-semibold mt-1.5'>Active cases in store registry</p>
        </div>

        <div className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950/80'>
          <div className='flex items-center justify-between'>
            <p className='text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-550'>High Risk Alerts</p>
            <div className='grid h-8 w-8 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-950/40 dark:text-rose-455'>
              <ShieldAlert className='h-4 w-4' />
            </div>
          </div>
          <p className='font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mt-3'>
            {copilotMetrics?.highRiskAlerts ?? 0}
          </p>
          <p className='text-[10px] text-slate-400 font-semibold mt-1.5'>Alerts labeled critical severity</p>
        </div>
      </div>

      {/* Main Copilot Content layout */}
      <div className='grid gap-6 lg:grid-cols-3 no-print'>
        {/* Left Column: Conversational Chat UI (Takes 2/3 space) */}
        <div className='lg:col-span-2 flex flex-col h-140 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/50 overflow-hidden shadow-xs'>
          
          {/* Chat Headers */}
          <div className='bg-slate-50/50 dark:bg-slate-900/40 p-4 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between'>
            <div className='flex items-center gap-2.5'>
              <div className='grid h-8 w-8 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400'>
                <Bot className='h-4.5 w-4.5 animate-pulse' />
              </div>
              <div>
                <p className='text-xs font-bold text-slate-900 dark:text-slate-100'>Fraud Copilot Assistant</p>
                <p className='text-[9px] text-emerald-500 font-bold tracking-wider mt-0.5 uppercase flex items-center gap-1'>
                  <span className='h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping' />
                  System Online & Ready
                </p>
              </div>
            </div>

            <div className='flex items-center gap-1.5'>
              {user?.role === 'Admin' && (
                <button
                  onClick={reindexRAG}
                  className='p-1.5 hover:bg-slate-100 text-slate-400 hover:text-sky-600 rounded-lg text-xs font-semibold transition flex items-center gap-1 dark:hover:bg-slate-850'
                  title={`Rebuild semantic RAG index. Stats: ${ragStats?.documents || 0} docs, ${ragStats?.chunks || 0} chunks.`}
                >
                  <RefreshCw className='h-3.5 w-3.5' /> Reindex RAG
                </button>
              )}
              <button
                onClick={clearCopilotHistory}
                className='p-1.5 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-lg text-xs font-semibold transition flex items-center gap-1 dark:hover:bg-slate-850'
                title='Reset Chat Logs'
              >
                <Trash2 className='h-3.5 w-3.5' /> Clear Log
              </button>
            </div>
          </div>

          {/* Chat Feed Messages Scroll Box */}
          <div className='flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none'>
            {copilotChats.length === 0 && (
              <div className='flex items-start gap-3.5 max-w-[85%] mr-auto'>
                <div className='grid h-8 w-8 place-items-center rounded-xl bg-sky-500/10 text-sky-600 border border-sky-500/20 shadow-xs shrink-0'>
                  <Bot className='h-4 w-4' />
                </div>
                <div className='rounded-2xl p-3.5 text-xs leading-relaxed border shadow-xs bg-sky-500/5 border-sky-500/10 text-slate-700 dark:bg-slate-950/20 dark:text-slate-300'>
                  <p className='font-bold mb-1 text-slate-900 dark:text-white'>Welcome to the AI Fraud Copilot Center!</p>
                  <p>Query platform statistics using natural language, compile auto-investigation summaries, analyze upcoding fraud alerts, and receive operational audit recommendations.</p>
                </div>
              </div>
            )}
            {copilotChats.map((msg) => {
              const isUser = msg.sender === 'user'
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex items-start gap-3.5 max-w-[85%] transition-all',
                    isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  )}
                >
                  {/* Sender Icon */}
                  <div
                    className={cn(
                      'grid h-8 w-8 place-items-center rounded-xl text-xs font-bold shrink-0 border shadow-xs',
                      isUser
                        ? 'bg-slate-50 border-slate-200 text-slate-650 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350'
                        : 'bg-sky-500/10 border-sky-500/20 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400'
                    )}
                  >
                    {isUser ? <User className='h-4 w-4' /> : <Bot className='h-4 w-4' />}
                  </div>

                  {/* Message Bubble content */}
                  <div className='space-y-1.5'>
                    <div
                      className={cn(
                        'rounded-2xl p-3.5 text-xs leading-relaxed whitespace-pre-wrap border shadow-xs transition duration-200',
                        isUser
                          ? 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-200'
                          : 'bg-sky-500/5 border-sky-500/10 text-slate-700 dark:bg-slate-950/20 dark:text-slate-300',
                        msg.isPinned && 'border-amber-400 dark:border-amber-600 bg-amber-500/5'
                      )}
                    >
                      <div className='prose prose-sm dark:prose-invert font-sans max-w-none text-left'>
                        {/* Dynamic custom renderer (supporting bold lists, items) */}
                        {msg.text.split('\n').map((line, lIdx) => {
                          if (line.startsWith('-')) {
                            return (
                              <li key={lIdx} className='ml-3 list-disc mt-0.5'>
                                {line.substring(2)}
                              </li>
                            )
                          }
                          return <p key={lIdx} className='mt-1'>{line}</p>
                        })}
                      </div>

                      {/* Semantic RAG citations */}
                      {!isUser && msg.insightData?.sources && msg.insightData.sources.length > 0 && (
                        <div className='mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 no-print'>
                          <p className='text-[9px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1'>
                            <BookmarkCheck className='h-3 w-3 text-sky-500 animate-pulse' />
                            Verified Knowledge Citations
                          </p>
                          <div className='grid gap-1.5 grid-cols-1 sm:grid-cols-2 mt-1'>
                            {msg.insightData.sources.map((src, sIdx) => (
                              <div
                                key={sIdx}
                                className='p-2 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 border border-slate-150/80 dark:bg-slate-900/60 dark:hover:bg-slate-900 dark:border-slate-850 transition flex flex-col gap-1 text-[9px]'
                                title={src.content}
                              >
                                <div className='flex items-center justify-between font-bold text-slate-800 dark:text-slate-200'>
                                  <span className='truncate max-w-[120px]'>{src.title}</span>
                                  <Badge className='px-1 py-0 bg-sky-500/10 text-sky-600 border-none font-bold text-[8px] scale-95 shrink-0'>
                                    {Math.round(src.confidence_score * 100)}% Match
                                  </Badge>
                                </div>
                                <p className='text-slate-450 dark:text-slate-400 font-semibold truncate'>
                                  Source: <span className='text-sky-500 dark:text-sky-400'>{src.source_type} ({src.source_id})</span>
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Associated suggested follow-up queries or action recomendations */}
                      {!isUser && msg.recommendations && msg.recommendations.length > 0 && (
                        <div className='mt-4 pt-3 border-t border-slate-100 dark:border-slate-900 flex flex-wrap gap-2.5'>
                          {msg.recommendations.map((rec, rIdx) => (
                            <button
                              key={rIdx}
                              onClick={() => handleSendMessage(rec.query)}
                              className='px-2.5 py-1 text-[10px] font-bold rounded-lg border border-sky-500/20 bg-sky-500/10 text-sky-650 hover:bg-sky-550 hover:text-white transition'
                            >
                              {rec.title} &rarr;
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Timestamp & Bookmark Pin Actions */}
                    <div
                      className={cn(
                        'flex items-center gap-2 text-[9px] font-semibold text-slate-400 px-1',
                        isUser ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {!isUser && (
                        <>
                          <span>&bull;</span>
                          <button
                            onClick={() => handleTogglePin(msg.id)}
                            className={cn(
                              'hover:text-amber-500 transition flex items-center gap-0.5',
                              msg.isPinned ? 'text-amber-500' : 'text-slate-400'
                            )}
                          >
                            <Pin className={cn('h-2.5 w-2.5', msg.isPinned && 'fill-amber-500')} />
                            {msg.isPinned ? 'Pinned' : 'Pin'}
                          </button>
                          <span>&bull;</span>
                          <button
                            onClick={() => handleSaveQuery(copilotChats[copilotChats.indexOf(msg) - 1]?.text || msg.text)}
                            className='hover:text-sky-500 transition flex items-center gap-0.5'
                          >
                            <Bookmark className='h-2.5 w-2.5' /> Save Query
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Simulated typing loader indicator */}
            {isTyping && (
              <div className='flex items-start gap-3.5 max-w-[85%] mr-auto'>
                <div className='grid h-8 w-8 place-items-center rounded-xl bg-sky-500/10 text-sky-650 border border-sky-500/20 shadow-xs shrink-0 animate-bounce'>
                  <Bot className='h-4 w-4' />
                </div>
                <div className='bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-1.5 dark:bg-slate-900/60 dark:border-slate-850'>
                  <span className='h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce' style={{ animationDelay: '0ms' }} />
                  <span className='h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce' style={{ animationDelay: '150ms' }} />
                  <span className='h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce' style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Preset Prompts Suggestion Bar */}
          <div className='px-4 py-2 bg-slate-50/30 border-t border-slate-100 dark:bg-slate-950/20 dark:border-slate-900/60 suggestion-bar'>
            <div className='flex gap-2 overflow-x-auto pb-1 scrollbar-none'>
              {copilotSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item)}
                  className='px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-[10px] font-bold whitespace-nowrap transition dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-850'
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* User Text Input Box */}
          <div className='p-4 border-t border-slate-100 bg-slate-50/50 dark:bg-slate-900/20 dark:border-slate-900 flex items-center gap-3.5'>
            <input
              type='text'
              placeholder='Ask Copilot: "Who is the highest risk provider?", "Summarize recent alerts"...'
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              className='flex-1 rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs placeholder-slate-400 outline-hidden transition focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200'
            />
            
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim()}
              className='p-2.5 rounded-xl bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 transition flex items-center justify-center shrink-0 shadow-sm'
            >
              <Send className='h-4 w-4' />
            </button>
          </div>
        </div>

        {/* Right Column: Co-Intelligence Center Panel */}
        <div className='space-y-6 lg:col-span-1'>
          
          {/* Tab Selector Navs */}
          <div className='flex gap-1 p-1 bg-slate-100 rounded-xl dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80'>
            {[
              { id: 'insights', label: 'Insights' },
              { id: 'saved', label: 'Saved' },
              { id: 'summarizer', label: 'Summarize' },
              { id: 'recommendations', label: 'Rules' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition',
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-950 dark:text-slate-400'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dynamic Tab Body renders */}
          <AnimatePresence mode='wait'>
            {activeTab === 'insights' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className='space-y-4'
              >
                {/* Top Risk Providers Insight Card */}
                <Card>
                  <CardHeader className='pb-2.5'>
                    <CardTitle className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 flex items-center justify-between'>
                      <span>Top composite Risk Providers</span>
                      <Badge className='bg-rose-500/10 text-rose-600 border-none font-bold text-[9px]'>Highest Score</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='pt-1 space-y-2.5'>
                    {copilotContext.topProviders.slice(0, 3).map((p, idx) => (
                      <div
                        key={p.name}
                        onClick={() => handleSendMessage(`Explain ${p.name} risk score.`)}
                        className='p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/80 cursor-pointer flex items-center justify-between dark:border-slate-900 dark:bg-slate-900/40 dark:hover:bg-slate-900 transition'
                      >
                        <div className='flex items-center gap-2.5'>
                          <span className='text-xs font-bold text-slate-400'>0{idx + 1}</span>
                          <div>
                            <p className='text-xs font-bold text-slate-800 dark:text-slate-200'>{p.name}</p>
                            <p className='text-[9px] text-slate-400 font-semibold mt-0.5'>{p.claims} claims billed &bull; {p.fraudCount || 2} anomalies</p>
                          </div>
                        </div>
                        <span className={cn(
                          'text-xs font-bold px-2 py-0.5 rounded-lg border',
                          p.score >= 70 ? 'bg-rose-500/10 text-rose-600 border-rose-500/10' :
                          p.score >= 45 ? 'bg-orange-500/10 text-orange-600 border-orange-500/10' : 'bg-slate-100 text-slate-700 dark:bg-slate-800'
                        )}>
                          {p.score}%
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Verification Issues Insight Card */}
                <Card>
                  <CardHeader className='pb-2.5'>
                    <CardTitle className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550'>
                      OCR verification mismatches
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='pt-1 space-y-2.5'>
                    {copilotContext.mismatchDocs.length === 0 ? (
                      <div className='text-center py-4 text-xs text-slate-400 italic'>No mismatch documents in record.</div>
                    ) : (
                      copilotContext.mismatchDocs.slice(0, 2).map((d) => (
                        <div
                          key={d.id}
                          onClick={() => handleSendMessage(`Show document verification mismatches.`)}
                          className='p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/80 cursor-pointer flex flex-col gap-1.5 dark:border-slate-900 dark:bg-slate-900/40 dark:hover:bg-slate-900 transition'
                        >
                          <div className='flex items-center justify-between'>
                            <span className='text-xs font-bold text-slate-800 dark:text-slate-200'>{d.id}</span>
                            <Badge className='bg-rose-500/10 text-rose-600 border-none font-bold text-[9px] uppercase'>Mismatch</Badge>
                          </div>
                          <p className='text-[10px] text-slate-450 dark:text-slate-400 leading-relaxed font-semibold'>
                            Discrepancy: <span className='text-rose-500'>"{d.metadata?.discrepancy || d.discrepancy || 'Billed codes mismatch OCR'}"</span>
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Tab 2: Saved Queries list */}
            {activeTab === 'saved' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
              >
                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550'>
                      Bookmarked Prompt List
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='pt-2 space-y-2 max-h-80 overflow-y-auto scrollbar-none'>
                    {savedQueries.length === 0 ? (
                      <div className='text-center py-6 text-xs text-slate-450 italic'>No bookmarked queries found. Click "Save Query" under assistant replies.</div>
                    ) : (
                      savedQueries.map((q) => (
                        <div
                          key={q.id}
                          onClick={() => handleSendMessage(q.text)}
                          className='p-2.5 rounded-xl border border-slate-150 bg-slate-50/50 hover:bg-slate-100/80 cursor-pointer text-xs font-bold text-slate-700 flex items-center justify-between dark:border-slate-900 dark:bg-slate-900/40 dark:hover:bg-slate-900 dark:text-slate-350 transition'
                        >
                          <p className='truncate pr-3'>{q.text}</p>
                          <ChevronRight className='h-4 w-4 text-slate-400 shrink-0' />
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Tab 3: Auto Investigation Summary Compiler */}
            {activeTab === 'summarizer' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className='space-y-4'
              >
                <Card>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 flex items-center justify-between'>
                      <span>Investigation compiler</span>
                      <Badge className='bg-sky-500/10 text-sky-600 border-none font-bold text-[9px]'>Auto-generator</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='pt-1 space-y-3'>
                    <div>
                      <label className='text-[10px] font-bold text-slate-400 uppercase block mb-1'>Select Active Case</label>
                      <select
                        value={selectedCaseId}
                        onChange={(e) => setSelectedCaseId(e.target.value)}
                        className='w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs outline-hidden dark:border-slate-800 dark:bg-slate-900'
                      >
                        <option value=''>-- Choose Case ID --</option>
                        {cases.map((c) => (
                          <option key={c.id} value={c.id}>{c.id} (Provider: {c.provider})</option>
                        ))}
                      </select>
                    </div>

                    {compiledCaseSummary ? (
                      <div className='space-y-3'>
                        <div className='p-3 bg-slate-50 border border-slate-150 rounded-xl max-h-48 overflow-y-auto text-[10px] font-semibold leading-relaxed text-slate-700 dark:bg-slate-900/60 dark:border-slate-850 dark:text-slate-350 scrollbar-none'>
                          <pre className='whitespace-pre-wrap font-sans'>{compiledCaseSummary}</pre>
                        </div>
                        <div className='flex justify-end gap-2'>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(compiledCaseSummary)
                              toast.success('Summary copied to clipboard!')
                            }}
                            className='py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-600 dark:border-slate-850 dark:hover:bg-slate-900 dark:text-slate-400 transition'
                          >
                            Copy text
                          </button>
                          <button
                            onClick={handleExportSummary}
                            className='py-1.5 px-3 rounded-lg bg-sky-600 text-white hover:bg-sky-700 text-[10px] font-bold transition flex items-center gap-1 shadow-xs'
                          >
                            <Download className='h-3 w-3' /> Export MD
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className='text-center py-6 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 italic dark:border-slate-850'>
                        Select a case from the list above to generate an audit summary.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Tab 4: Dynamic Operational Recommendations Engine */}
            {activeTab === 'recommendations' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
              >
                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550'>
                      Operational recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='pt-1 space-y-3'>
                    <div className='p-3 rounded-xl border border-rose-500/10 bg-rose-500/5 text-xs'>
                      <p className='font-bold text-rose-600 flex items-center gap-1.5'>
                        <ShieldAlert className='h-4 w-4' /> Escalate Provider B Case
                      </p>
                      <p className='text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-semibold'>
                        Anomaly density is critical. Convert pending Provider B alerts into formal investigations.
                      </p>
                      <button
                        onClick={() => {
                          handleSendMessage('Explain Provider B risk score.')
                          setActiveTab('insights')
                        }}
                        className='mt-2.5 py-1 px-2.5 bg-rose-600 text-white rounded-lg text-[9px] font-bold hover:bg-rose-700 transition'
                      >
                        Inspect Risk score
                      </button>
                    </div>

                    <div className='p-3 rounded-xl border border-amber-500/10 bg-amber-500/5 text-xs'>
                      <p className='font-bold text-amber-600 flex items-center gap-1.5'>
                        <AlertTriangle className='h-4 w-4' /> Audit OCR Discrepancies
                      </p>
                      <p className='text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-semibold'>
                        Document DOC-201 and DOC-202 indicate double-billing and codes mismatches.
                      </p>
                      <button
                        onClick={() => {
                          handleSendMessage('Show document verification mismatches.')
                          setActiveTab('insights')
                        }}
                        className='mt-2.5 py-1 px-2.5 bg-amber-500 text-black rounded-lg text-[9px] font-bold hover:bg-amber-600 transition'
                      >
                        Inspect OCR Logs
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Hidden Print Area structured specifically for PDF report exports */}
      <div className='hidden print-area space-y-6'>
        <div className='border-b-2 border-slate-300 pb-4'>
          <h1 className='text-2xl font-bold'>Healthcare AI Platform - Copilot Chat History Report</h1>
          <p className='text-xs text-slate-500 mt-1'>Report generated on: {new Date().toLocaleString()}</p>
        </div>

        <div className='print-card border border-slate-200 p-4 rounded-xl'>
          <h3 className='text-sm font-bold uppercase text-slate-500 mb-3'>Chat History Records</h3>
          <div className='space-y-4 text-xs'>
            {copilotChats.map((c, idx) => (
              <div key={idx} className='pb-2 border-b border-slate-100 last:border-none'>
                <p className='font-bold text-slate-700 uppercase'>
                  {c.sender === 'user' ? 'USER' : 'AI COPILOT'} - {new Date(c.timestamp).toLocaleTimeString()}
                </p>
                <p className='mt-1 whitespace-pre-wrap leading-relaxed'>{c.text}</p>
              </div>
            ))}
          </div>
        </div>

        {compiledCaseSummary && (
          <div className='print-card border border-slate-200 p-4 rounded-xl'>
            <h3 className='text-sm font-bold uppercase text-slate-500 mb-3'>Active Investigation Compilation</h3>
            <pre className='whitespace-pre-wrap font-sans text-xs leading-relaxed'>{compiledCaseSummary}</pre>
          </div>
        )}
      </div>
    </section>
  )
}
