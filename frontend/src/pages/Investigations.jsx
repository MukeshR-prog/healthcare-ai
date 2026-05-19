import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import {
  ClipboardCheck,
  Search,
  SlidersHorizontal,
  ChevronRight,
  X,
  User,
  Activity,
  ShieldAlert,
  CheckCircle,
  Percent,
  Download,
  Printer,
  Calendar,
  AlertTriangle,
  Send,
  MessageSquare,
  Clock,
  Briefcase,
  Layers,
  ArrowRight,
  HelpCircle,
  Check,
  Inbox
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useApi } from '@/hooks/useApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency, formatPercent } from '@/utils/format'
import { cn } from '@/utils/cn'

// Severity/Priority colors helper
const getPriorityBadge = (pri) => {
  if (pri === 'Critical') return <span className='inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700 dark:bg-rose-950/40 dark:text-rose-350'>Critical</span>
  if (pri === 'High') return <span className='inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-700 dark:bg-orange-950/40 dark:text-orange-350'>High</span>
  if (pri === 'Medium') return <span className='inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'>Medium</span>
  return <span className='inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-350'>Low</span>
}

// Status workflow badge helper
const getStatusBadge = (st) => {
  if (st === 'Closed') return <span className='inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'><CheckCircle className='h-3 w-3' /> Closed</span>
  if (st === 'Confirmed Fraud') return <span className='inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700 dark:bg-rose-950/40 dark:text-rose-350'><ShieldAlert className='h-3 w-3' /> Fraud</span>
  if (st === 'Escalated') return <span className='inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-700 dark:bg-orange-950/40 dark:text-orange-350'><AlertTriangle className='h-3 w-3' /> Escalated</span>
  if (st === 'Investigating') return <span className='inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-700 dark:bg-sky-950/20 dark:text-sky-400'><Activity className='h-3 w-3' /> Investigating</span>
  if (st === 'Under Review') return <span className='inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-950/20 dark:text-amber-450'><Layers className='h-3 w-3' /> Review</span>
  return <span className='inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-350'><Briefcase className='h-3 w-3' /> New</span>
}

// Case Drawer slide-over component
function CaseDrawer({ caseItem, onClose, onUpdateStatus, onUpdateAssignment, onAddNote }) {
  const [analyst, setAnalyst] = useState(caseItem?.assignedTo || 'Unassigned')
  const [priority, setPriority] = useState(caseItem?.priority || 'Medium')
  const [noteText, setNoteText] = useState('')
  const [currentAnalyst, setCurrentAnalyst] = useState('John Doe')

  const analysts = ['John Doe', 'Sarah Connor', 'Alex Mercer', 'Jane Smith', 'Unassigned']
  const priorities = ['Critical', 'High', 'Medium', 'Low']
  const statuses = ['New', 'Under Review', 'Investigating', 'Escalated', 'Confirmed Fraud', 'Closed']

  useEffect(() => {
    if (caseItem) {
      setAnalyst(caseItem.assignedTo)
      setPriority(caseItem.priority)
    }
  }, [caseItem])

  if (!caseItem) return null

  const handleSaveMetadata = () => {
    onUpdateAssignment(caseItem.id, analyst, priority)
  }

  const handleStatusChange = (newStatus) => {
    onUpdateStatus(caseItem.id, newStatus, `Status transitioned to ${newStatus} by analyst ${currentAnalyst}.`)
  }

  const handlePostNote = (e) => {
    e.preventDefault()
    if (!noteText.trim()) return
    onAddNote(caseItem.id, noteText, currentAnalyst)
    setNoteText('')
  }

  const getPriorityColor = (pri) => {
    if (pri === 'Critical') return 'bg-rose-500 text-white'
    if (pri === 'High') return 'bg-orange-500 text-white'
    if (pri === 'Medium') return 'bg-amber-500 text-slate-900'
    return 'bg-emerald-500 text-white'
  }

  return (
    <div className='fixed inset-0 z-50 overflow-hidden'>
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className='absolute inset-0 bg-slate-950/60 backdrop-blur-xs'
      />

      <div className='absolute inset-y-0 right-0 flex max-w-full pl-10'>
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
          className='w-screen max-w-lg bg-white shadow-2xl dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between h-full'
        >
          {/* Header */}
          <div className='border-b border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800/80 dark:bg-slate-900/40 flex items-center justify-between'>
            <div>
              <div className='flex items-center gap-2'>
                <ClipboardCheck className='h-5 w-5 text-sky-600' />
                <h3 className='font-display text-base font-bold text-slate-900 dark:text-slate-100'>
                  Case File Auditor
                </h3>
              </div>
              <p className='text-xs text-slate-400 font-semibold mt-0.5'>{caseItem.id}</p>
            </div>
            <button
              type='button'
              onClick={onClose}
              className='grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400'
            >
              <X className='h-4.5 w-4.5' />
            </button>
          </div>

          {/* Drawer Body Scroll */}
          <div className='flex-1 overflow-y-auto p-5 space-y-6 scrollbar-none'>
            
            {/* Status Workflow Stepper */}
            <div className='space-y-3'>
              <h4 className='text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500'>Workflow Actions</h4>
              <div className='grid grid-cols-3 gap-1.5'>
                {statuses.map((st) => (
                  <button
                    key={st}
                    type='button'
                    onClick={() => handleStatusChange(st)}
                    className={cn(
                      'py-1.5 px-2.5 text-[10px] font-bold rounded-xl border transition-all duration-200 text-center uppercase tracking-wide',
                      caseItem.status === st
                        ? 'bg-sky-600 text-white border-transparent shadow-md shadow-sky-500/10'
                        : 'bg-slate-50/50 border-slate-200/60 text-slate-600 hover:bg-slate-100 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800'
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Analyst & Priority Meta Editors */}
            <div className='border-t border-slate-100 pt-5 dark:border-slate-800/80 grid grid-cols-2 gap-4'>
              <div>
                <label className='text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 block mb-1.5'>Assigned Analyst</label>
                <select
                  value={analyst}
                  onChange={(e) => { setAnalyst(e.target.value); }}
                  onBlur={handleSaveMetadata}
                  className='h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                >
                  {analysts.map((name) => (
                    <option key={`drawer-analyst-${name}`} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className='text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 block mb-1.5'>Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => { setPriority(e.target.value); }}
                  onBlur={handleSaveMetadata}
                  className='h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                >
                  {priorities.map((p) => (
                    <option key={`drawer-priority-${p}`} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Claim Details */}
            <div className='border-t border-slate-100 pt-5 dark:border-slate-800/80 space-y-3'>
              <h4 className='text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500'>Claim Particulars</h4>
              <div className='grid grid-cols-3 gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 dark:bg-slate-900/30 dark:border-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-350'>
                <div>
                  <span className='text-[9px] font-bold text-slate-450 uppercase block mb-0.5'>Billing Provider</span>
                  <span className='text-slate-900 dark:text-slate-100'>{caseItem.provider}</span>
                </div>
                <div>
                  <span className='text-[9px] font-bold text-slate-450 uppercase block mb-0.5'>Claim Amount</span>
                  <span className='text-sky-600 dark:text-sky-400 font-bold'>{formatCurrency(caseItem.amount)}</span>
                </div>
                <div>
                  <span className='text-[9px] font-bold text-slate-450 uppercase block mb-0.5'>Risk Index</span>
                  <span className='text-rose-600 dark:text-rose-450 font-bold'>{formatPercent(caseItem.riskScore)}</span>
                </div>
                <div>
                  <span className='text-[9px] font-bold text-slate-450 uppercase block mb-0.5'>Flagged Severity</span>
                  <span>{caseItem.severity}</span>
                </div>
                <div>
                  <span className='text-[9px] font-bold text-slate-450 uppercase block mb-0.5'>Claim ID Reference</span>
                  <span>{caseItem.claimId}</span>
                </div>
                <div>
                  <span className='text-[9px] font-bold text-slate-450 uppercase block mb-0.5'>Alert Linked</span>
                  <span>{caseItem.alertId}</span>
                </div>
              </div>
            </div>

            {/* Case Timeline Activity Log */}
            <div className='border-t border-slate-100 pt-5 dark:border-slate-800/80 space-y-3.5'>
              <h4 className='text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500'>Case History & Chronological Timeline</h4>
              
              <div className='relative pl-6 space-y-4 border-l border-slate-200 dark:border-slate-800 ml-3'>
                {caseItem.timeline.map((event, idx) => (
                  <div key={`timeline-${idx}`} className='relative group'>
                    {/* Stepper Node */}
                    <div className='absolute -left-[30px] top-0.5 h-4 w-4 rounded-full border-2 border-white bg-sky-500 dark:border-slate-950 flex items-center justify-center'>
                      <Check className='h-2 w-2 text-white' />
                    </div>
                    <div>
                      <div className='flex items-center justify-between text-xs font-semibold'>
                        <span className='text-slate-800 dark:text-slate-250'>{event.title}</span>
                        <span className='text-[9px] font-medium text-slate-450 dark:text-slate-500 flex items-center gap-1'>
                          <Clock className='h-2.5 w-2.5' />
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className='text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal'>
                        {event.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Collaborative Notes Feed */}
            <div className='border-t border-slate-100 pt-5 dark:border-slate-800/80 space-y-4'>
              <div className='flex items-center justify-between'>
                <h4 className='text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500'>Analyst Notes Feed</h4>
                
                {/* Switch Analyst Persona */}
                <div className='flex items-center gap-1.5 text-[10px] text-slate-400 font-bold'>
                  <span>Comment as:</span>
                  <select
                    value={currentAnalyst}
                    onChange={(e) => setCurrentAnalyst(e.target.value)}
                    className='bg-transparent border-none font-extrabold text-sky-600 dark:text-sky-400 cursor-pointer focus:outline-none'
                  >
                    {analysts.filter(x => x !== 'Unassigned').map((a) => (
                      <option key={`comment-author-${a}`} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Feed List */}
              <div className='space-y-3 max-h-48 overflow-y-auto pr-1 scrollbar-none'>
                {caseItem.notes.length === 0 ? (
                  <div className='text-center py-4 text-[10px] text-slate-450 italic'>No notes recorded on case yet.</div>
                ) : (
                  caseItem.notes.map((n, idx) => (
                    <div key={`note-${idx}`} className='p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/50 dark:border-slate-900 space-y-1.5'>
                      <div className='flex justify-between items-center text-[10px] font-bold text-slate-400'>
                        <span className='text-slate-700 dark:text-slate-350 flex items-center gap-1'>
                          <User className='h-3 w-3 text-slate-450' />
                          {n.analyst}
                        </span>
                        <span className='font-semibold'>{new Date(n.date).toLocaleDateString()} {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className='text-xs text-slate-650 dark:text-slate-300 leading-normal'>
                        {n.text}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input Form */}
              <form onSubmit={handlePostNote} className='flex gap-2 relative mt-2'>
                <input
                  type='text'
                  placeholder='Log notes or audit details...'
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className='h-9 flex-1 rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-9 text-xs text-slate-800 transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-slate-850 dark:bg-slate-900 dark:text-slate-200 dark:focus:bg-slate-950'
                />
                <button
                  type='submit'
                  disabled={!noteText.trim()}
                  className='absolute right-1.5 top-1.5 h-6 w-6 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-30 transition flex items-center justify-center text-white'
                >
                  <Send className='h-3 w-3' />
                </button>
              </form>
            </div>

          </div>

          {/* Drawer Footer Actions */}
          <div className='border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-900/40 flex justify-end gap-2'>
            <button
              type='button'
              onClick={onClose}
              className='py-2 px-4.5 text-xs font-bold bg-sky-600 text-white rounded-xl hover:bg-sky-700 shadow-sm transition'
            >
              Conclude Review
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function Investigations() {
  const alerts = useStore((state) => state.alerts)
  const cases = useStore((state) => state.cases || [])
  const setCases = useStore((state) => state.setCases)
  const updateCaseStatus = useStore((state) => state.updateCaseStatus)
  const updateCaseAssignment = useStore((state) => state.updateCaseAssignment)
  const addCaseNote = useStore((state) => state.addCaseNote)
  const loadingHistory = useStore((state) => state.loadingByKey?.history)
  const { fetchHistory } = useApi()

  // Selection & Filters
  const [selectedCase, setSelectedCase] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterPriority, setFilterPriority] = useState('All')
  const [filterAnalyst, setFilterAnalyst] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('desc')
  const pageSize = 7

  // Sync / fetch history
  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Initialize mock cases from alerts if store is empty
  useEffect(() => {
    if (alerts && alerts.length > 0 && cases.length === 0) {
      const initialCases = alerts.slice(0, 7).map((a, i) => {
        const analysts = ['John Doe', 'Sarah Connor', 'Alex Mercer', 'Jane Smith']
        const priorities = ['Critical', 'High', 'Medium', 'Low']
        const statuses = ['New', 'Under Review', 'Investigating', 'Escalated', 'Confirmed Fraud', 'Closed']
        
        const analyst = analysts[i % analysts.length]
        const priority = priorities[i % priorities.length]
        const status = statuses[i % statuses.length]
        
        const statusHistoryMap = {
          'New': 'Case Created',
          'Under Review': 'Review Started',
          'Investigating': 'Investigation Started',
          'Escalated': 'Case Escalated',
          'Confirmed Fraud': 'Fraud Confirmed',
          'Closed': 'Case Closed'
        }

        const timeline = [
          { status: 'New', title: 'Case Created', date: new Date(new Date(a.created_at).getTime() - 24 * 3600 * 1000).toISOString(), desc: 'Investigation case initialized from fraud alert.' }
        ]
        if (status !== 'New') {
          timeline.push({
            status: 'Under Review',
            title: 'Review Started',
            date: new Date(new Date(a.created_at).getTime() - 12 * 3600 * 1000).toISOString(),
            desc: `Review initiated by analyst ${analyst}`
          })
        }
        if (status === 'Investigating' || status === 'Escalated' || status === 'Confirmed Fraud' || status === 'Closed') {
          timeline.push({
            status: 'Investigating',
            title: 'Investigation Started',
            date: new Date(new Date(a.created_at).getTime() - 4 * 3600 * 1000).toISOString(),
            desc: `Detailed audit started for Provider ${a.provider}.`
          })
        }
        if (status === 'Escalated') {
          timeline.push({
            status: 'Escalated',
            title: 'Case Escalated',
            date: new Date(a.created_at).toISOString(),
            desc: 'Case escalated to senior compliance board.'
          })
        }
        if (status === 'Confirmed Fraud') {
          timeline.push({
            status: 'Confirmed Fraud',
            title: 'Fraud Confirmed',
            date: new Date(a.created_at).toISOString(),
            desc: 'Model prediction verified. Provider flag raised.'
          })
        }
        if (status === 'Closed') {
          timeline.push({
            status: 'Closed',
            title: 'Case Closed',
            date: new Date(a.created_at).toISOString(),
            desc: 'Audit completed. No active fraud confirmed.'
          })
        }

        return {
          id: `CASE-99${String(i + 1).padStart(3, '0')}`,
          alertId: a.id,
          claimId: a.claimId || `CL-65${String(i + 1).padStart(3, '0')}`,
          provider: a.provider,
          amount: a.amount,
          riskScore: a.riskScore,
          severity: a.severity,
          status: status,
          assignedTo: analyst,
          priority: priority,
          created_at: new Date(new Date(a.created_at).getTime() - 24 * 3600 * 1000).toISOString(),
          updated_at: new Date(a.created_at).toISOString(),
          notes: [
            { text: `Initial inspection of ${formatCurrency(a.amount)} claim launched.`, date: new Date(new Date(a.created_at).getTime() - 20 * 3600 * 1000).toISOString(), analyst: 'System' }
          ],
          timeline: timeline
        }
      })
      setCases(initialCases)
    }
  }, [alerts, cases.length, setCases])

  // Overview metrics
  const stats = useMemo(() => {
    if (cases.length === 0) return { total: 0, open: 0, review: 0, resolved: 0 }
    
    const total = cases.length
    const open = cases.filter(c => c.status !== 'Closed' && c.status !== 'Confirmed Fraud').length
    const review = cases.filter(c => c.status === 'Under Review').length
    const resolved = cases.filter(c => c.status === 'Closed' || c.status === 'Confirmed Fraud').length
    
    return { total, open, review, resolved }
  }, [cases])

  // Filtering cases
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Search matches
      const query = search.toLowerCase()
      const textMatch =
        c.id.toLowerCase().includes(query) ||
        c.provider.toLowerCase().includes(query) ||
        c.assignedTo.toLowerCase().includes(query)
      if (!textMatch) return false

      // Filters
      if (filterStatus !== 'All' && c.status !== filterStatus) return false
      if (filterPriority !== 'All' && c.priority !== filterPriority) return false
      if (filterAnalyst !== 'All' && c.assignedTo !== filterAnalyst) return false

      return true
    })
  }, [cases, search, filterStatus, filterPriority, filterAnalyst])

  // Sorting
  const sortedCases = useMemo(() => {
    return [...filteredCases].sort((a, b) => {
      let valA = a[sortField]
      let valB = b[sortField]
      
      if (sortField === 'created_at') {
        valA = new Date(a.created_at).getTime()
        valB = new Date(b.created_at).getTime()
      }

      if (typeof valA === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
      }
      return sortDirection === 'asc' ? valA - valB : valB - valA
    })
  }, [filteredCases, sortField, sortDirection])

  // Pagination
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedCases.slice(start, start + pageSize)
  }, [sortedCases, currentPage])

  const totalPages = Math.max(1, Math.ceil(sortedCases.length / pageSize))

  // Unique lists for filters
  const uniqueAnalysts = useMemo(() => {
    const set = new Set()
    cases.forEach(c => {
      if (c.assignedTo) set.add(c.assignedTo)
    })
    return Array.from(set).sort()
  }, [cases])

  // Reset filters
  const handleResetFilters = () => {
    setSearch('')
    setFilterStatus('All')
    setFilterPriority('All')
    setFilterAnalyst('All')
    setCurrentPage(1)
  }

  // Request sort
  const requestSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Sync selected case if list updates
  const activeCaseInDrawer = useMemo(() => {
    if (!selectedCase) return null
    return cases.find(c => c.id === selectedCase.id) || null
  }, [selectedCase, cases])

  // Recharts: Cases by Status donut
  const statusChartData = useMemo(() => {
    const counts = {}
    cases.forEach(c => {
      counts[c.status] = (counts[c.status] || 0) + 1
    })

    const colors = {
      New: '#64748b',
      'Under Review': '#eab308',
      Investigating: '#0ea5e9',
      Escalated: '#f97316',
      'Confirmed Fraud': '#f43f5e',
      Closed: '#10b981'
    }

    return Object.keys(counts).map(status => ({
      name: status,
      value: counts[status],
      color: colors[status] || '#cbd5e1'
    }))
  }, [cases])

  // Recharts: Analyst Workload
  const analystChartData = useMemo(() => {
    const workload = {}
    cases.forEach(c => {
      if (c.status !== 'Closed') {
        workload[c.assignedTo] = (workload[c.assignedTo] || 0) + 1
      }
    })

    return Object.keys(workload).map(name => ({
      name,
      'Active Cases': workload[name]
    })).sort((a,b) => b['Active Cases'] - a['Active Cases'])
  }, [cases])

  // Recharts: Resolution Trends
  const trendChartData = useMemo(() => {
    const dates = {}
    cases.forEach(c => {
      const dateStr = new Date(c.created_at).toISOString().split('T')[0]
      if (!dates[dateStr]) {
        dates[dateStr] = { date: dateStr, created: 0, resolved: 0 }
      }
      dates[dateStr].created++
      if (c.status === 'Closed' || c.status === 'Confirmed Fraud') {
        dates[dateStr].resolved++
      }
    })

    return Object.keys(dates).sort().map(date => ({
      date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      'Cases Opened': dates[date].created,
      'Cases Resolved': dates[date].resolved
    }))
  }, [cases])

  // CSV Exporter
  const handleExportCSV = () => {
    if (filteredCases.length === 0) return
    const headers = ['Case ID', 'Alert ID', 'Claim ID', 'Provider', 'Claim Amount', 'Risk Score', 'Severity', 'Analyst', 'Status', 'Priority', 'Date Created']
    const rows = filteredCases.map(c => [
      c.id,
      c.alertId,
      c.claimId,
      `"${c.provider}"`,
      c.amount,
      c.riskScore,
      c.severity,
      `"${c.assignedTo}"`,
      c.status,
      c.priority,
      c.created_at
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Investigations_Cases_Export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Print PDF exporter
  const handleExportPDF = () => {
    window.print()
  }

  // Skeletons
  if (loadingHistory && cases.length === 0) {
    return (
      <section className='space-y-6'>
        {/* Metric Cards Skeletons */}
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`metric-skeleton-${idx}`} className='relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800/80 dark:bg-slate-950/80 shadow-xs'>
              <div className='flex items-center justify-between'>
                <Skeleton className='h-3.5 w-24' />
                <Skeleton className='h-9 w-9 rounded-2xl' />
              </div>
              <Skeleton className='mt-3.5 h-8 w-28' />
              <Skeleton className='mt-3 h-3 w-40' />
            </div>
          ))}
        </div>
        {/* Charts row skeleton */}
        <div className='grid gap-6 xl:grid-cols-3'>
          <div className='xl:col-span-2 rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-950/80 h-96' />
          <div className='rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-950/80 h-96' />
        </div>
      </section>
    )
  }

  return (
    <section className='space-y-6 relative'>
      {/* Stylesheet classes to handle clean printing of case summary report */}
      <style>{`
        @media print {
          aside, nav, header, .no-print, button, select, input, .mobile-nav-class {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-area {
            display: block !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
          }
          .print-card {
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            border-radius: 12px !important;
            padding: 16px !important;
            margin-bottom: 16px !important;
            break-inside: avoid;
          }
        }
      `}</style>

      {/* Header (No-print) */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-[linear-gradient(to_right,#f0f9ff,#eff6ff,#ffffff)] p-5 shadow-xs dark:border-slate-800/90 dark:bg-[linear-gradient(to_right,rgba(8,47,73,0.2),rgba(30,58,138,0.18),rgba(2,6,23,0.6))] no-print'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300 flex items-center gap-1.5'>
            <ClipboardCheck className='h-3.5 w-3.5 text-sky-500' />
            Resolution Workspace
          </p>
          <h2 className='mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white'>Investigation Case Observatory</h2>
          <p className='mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-350'>
            Track active fraud investigations, collaborate through analyst logs, update priorities, and manage review statuses.
          </p>
        </div>
        <div className='flex flex-wrap gap-2 sm:self-center shrink-0'>
          <button
            type='button'
            onClick={handleExportPDF}
            className='inline-flex items-center gap-1.5 rounded-xl border border-slate-250 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-55 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/90 transition shadow-xs'
          >
            <Printer className='h-3.5 w-3.5' />
            Print Logs
          </button>
          <button
            type='button'
            onClick={handleExportCSV}
            className='inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-sky-700 transition shadow-sm'
          >
            <Download className='h-3.5 w-3.5' />
            Export Data
          </button>
        </div>
      </div>

      {/* KPI Overview Cards (No-print) */}
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4 no-print'>
        <div className='relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/92 p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/80 group'>
          <div className='absolute inset-0 bg-linear-to-br from-sky-500/10 via-transparent to-transparent -z-10 opacity-30 dark:opacity-20' />
          <div className='flex items-center justify-between'>
            <p className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500'>Total Cases</p>
            <div className='grid h-9 w-9 place-items-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-500/20 shadow-xs'>
              <ClipboardCheck className='h-4.5 w-4.5' />
            </div>
          </div>
          <p className='font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-3.5'>{stats.total}</p>
          <p className='text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2'>Escalations in registry</p>
        </div>

        <div className='relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/92 p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/80 group'>
          <div className='absolute inset-0 bg-linear-to-br from-amber-500/10 via-transparent to-transparent -z-10 opacity-30 dark:opacity-20' />
          <div className='flex items-center justify-between'>
            <p className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500'>Active Queue</p>
            <div className='grid h-9 w-9 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-500/20 shadow-xs'>
              <Activity className='h-4.5 w-4.5' />
            </div>
          </div>
          <p className='font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-3.5'>{stats.open}</p>
          <p className='text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2'>Cases requiring resolution</p>
        </div>

        <div className='relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/92 p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/80 group'>
          <div className='absolute inset-0 bg-linear-to-br from-orange-500/10 via-transparent to-transparent -z-10 opacity-30 dark:opacity-20' />
          <div className='flex items-center justify-between'>
            <p className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500'>Under Review</p>
            <div className='grid h-9 w-9 place-items-center rounded-2xl bg-orange-500/10 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-500/20 shadow-xs'>
              <Layers className='h-4.5 w-4.5' />
            </div>
          </div>
          <p className='font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-3.5'>{stats.review}</p>
          <p className='text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2'>Initial evaluation phase</p>
        </div>

        <div className='relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/92 p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/80 group'>
          <div className='absolute inset-0 bg-linear-to-br from-emerald-500/10 via-transparent to-transparent -z-10 opacity-30 dark:opacity-20' />
          <div className='flex items-center justify-between'>
            <p className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500'>Concluded Audits</p>
            <div className='grid h-9 w-9 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20 shadow-xs'>
              <CheckCircle className='h-4.5 w-4.5' />
            </div>
          </div>
          <p className='font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-3.5'>{stats.resolved}</p>
          <p className='text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2'>Concluded review threads</p>
        </div>
      </div>

      {/* Analytics Row (No-print) */}
      <div className='grid gap-6 lg:grid-cols-3 no-print'>
        
        {/* Cases by Status Donut */}
        <Card className='h-96 flex flex-col justify-between'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider'>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className='flex-1 flex flex-col justify-between pb-4 pt-1'>
            {statusChartData.length === 0 ? (
              <div className='flex-1 flex items-center justify-center text-xs text-slate-400'>No status details</div>
            ) : (
              <>
                <div className='relative flex-1 flex items-center justify-center h-44 my-1'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx='50%'
                        cy='50%'
                        innerRadius={55}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey='value'
                      >
                        {statusChartData.map((entry) => (
                          <Cell key={`donut-${entry.name}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid #cbd5e1',
                          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                          fontSize: 11
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className='absolute flex flex-col items-center justify-center text-center'>
                    <span className='font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white'>
                      {cases.length}
                    </span>
                    <span className='text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-0.5'>
                      Active Cases
                    </span>
                  </div>
                </div>

                <div className='grid grid-cols-3 gap-1.5 mt-2'>
                  {statusChartData.map((item) => (
                    <span
                      key={item.name}
                      className='inline-flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-2 py-1 text-[9px] text-slate-650 dark:border-slate-900 dark:bg-slate-900/40 dark:text-slate-350'
                    >
                      <span className='flex items-center gap-1 truncate'>
                        <span className='h-1.5 w-1.5 rounded-full shrink-0' style={{ backgroundColor: item.color }} />
                        {item.name}
                      </span>
                      <span className='font-bold ml-1'>{item.value}</span>
                    </span>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Resolution Trends Timeline */}
        <Card className='h-96 flex flex-col justify-between lg:col-span-2'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider'>Case Creation & Resolution Timeline</CardTitle>
          </CardHeader>
          <CardContent className='flex-1 flex flex-col justify-between pb-4 pt-1'>
            <div className='flex-1 h-56 mt-2'>
              {trendChartData.length === 0 ? (
                <div className='h-full flex items-center justify-center text-xs text-slate-400'>No trend details available</div>
              ) : (
                <ResponsiveContainer width='100%' height='100%'>
                  <AreaChart data={trendChartData} margin={{ top: 8, right: 10, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id='openedArea' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor='#0ea5e9' stopOpacity={0.2} />
                        <stop offset='95%' stopColor='#0ea5e9' stopOpacity={0.01} />
                      </linearGradient>
                      <linearGradient id='closedArea' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor='#10b981' stopOpacity={0.2} />
                        <stop offset='95%' stopColor='#10b981' stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray='4 4' stroke='#cbd5e1' opacity={0.3} />
                    <XAxis dataKey='date' tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #cbd5e1',
                        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                        fontSize: 11
                      }}
                    />
                    <Area type='monotone' dataKey='Cases Opened' stroke='#0ea5e9' strokeWidth={2} fill='url(#openedArea)' />
                    <Area type='monotone' dataKey='Cases Resolved' stroke='#10b981' strokeWidth={2} fill='url(#closedArea)' />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className='flex justify-between px-1 text-[9px] text-slate-400 mt-2'>
              <span>Daily created cases versus resolution completions.</span>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main Cases Table Area */}
      <div className='print-area'>
        
        {/* Table Queue Controller */}
        <Card className='print-card'>
          <CardHeader className='pb-3 border-b border-slate-100 dark:border-slate-800/80 no-print'>
            <div className='flex flex-wrap items-center justify-between gap-4'>
              <div>
                <CardTitle className='text-sm font-semibold'>Audit Queue Registry</CardTitle>
                <p className='text-xs text-slate-400 font-semibold mt-0.5'>Audit and resolve active compliance logs</p>
              </div>

              {/* Filtering controllers */}
              <div className='flex flex-wrap items-center gap-3 w-full lg:w-auto'>
                {/* Search */}
                <div className='relative w-full sm:w-60'>
                  <Search className='absolute top-2.5 left-3 h-4 w-4 text-slate-400' />
                  <input
                    type='text'
                    placeholder='Search Case ID, Provider, Analyst...'
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    className='h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-800 transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                  className='h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350'
                >
                  <option value='All'>All Statuses</option>
                  <option value='New'>New</option>
                  <option value='Under Review'>Under Review</option>
                  <option value='Investigating'>Investigating</option>
                  <option value='Escalated'>Escalated</option>
                  <option value='Confirmed Fraud'>Confirmed Fraud</option>
                  <option value='Closed'>Closed</option>
                </select>

                {/* Priority Filter */}
                <select
                  value={filterPriority}
                  onChange={(e) => { setFilterPriority(e.target.value); setCurrentPage(1); }}
                  className='h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350'
                >
                  <option value='All'>All Priorities</option>
                  <option value='Critical'>Critical</option>
                  <option value='High'>High</option>
                  <option value='Medium'>Medium</option>
                  <option value='Low'>Low</option>
                </select>

                {/* Analyst Filter */}
                <select
                  value={filterAnalyst}
                  onChange={(e) => { setFilterAnalyst(e.target.value); setCurrentPage(1); }}
                  className='h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350'
                >
                  <option value='All'>All Analysts</option>
                  {uniqueAnalysts.map((name) => (
                    <option key={`filter-analyst-${name}`} value={name}>{name}</option>
                  ))}
                </select>

                {/* Reset Filters */}
                {(search || filterStatus !== 'All' || filterPriority !== 'All' || filterAnalyst !== 'All') && (
                  <button
                    type='button'
                    onClick={handleResetFilters}
                    className='text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400'
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </CardHeader>

          {/* Table Container */}
          <CardContent className='pt-4 overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead>
                <tr className='border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:border-slate-800/40 dark:text-slate-500'>
                  <th className='py-3'>Case ID</th>
                  <th className='py-3'>Provider</th>
                  <th className='py-3 text-right cursor-pointer hover:text-slate-650 dark:hover:text-slate-300' onClick={() => requestSort('amount')}>
                    Amount <span className='text-[9px]'>{sortField === 'amount' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className='py-3 text-right cursor-pointer hover:text-slate-650 dark:hover:text-slate-300' onClick={() => requestSort('riskScore')}>
                    Risk Score <span className='text-[9px]'>{sortField === 'riskScore' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className='py-3'>Analyst</th>
                  <th className='py-3'>Priority</th>
                  <th className='py-3'>Status</th>
                  <th className='py-3 text-right cursor-pointer hover:text-slate-650 dark:hover:text-slate-300' onClick={() => requestSort('created_at')}>
                    Date Created <span className='text-[9px]'>{sortField === 'created_at' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className='py-3 text-center no-print'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100 dark:divide-slate-900'>
                {sortedCases.length === 0 ? (
                  <tr>
                    <td colSpan={9} className='py-12'>
                      <EmptyState
                        title='No Cases Registered'
                        description='No current investigations match your filters or search constraints.'
                        action={
                          <button
                            type='button'
                            onClick={handleResetFilters}
                            className='rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs no-print'
                          >
                            Clear Filters
                          </button>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedCases.map((c) => (
                    <tr
                      key={c.id}
                      className={cn(
                        'hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors cursor-pointer',
                        selectedCase?.id === c.id ? 'bg-sky-50/20 dark:bg-sky-950/10 font-semibold' : ''
                      )}
                      onClick={() => setSelectedCase(c)}
                    >
                      <td className='py-3.5 font-extrabold text-slate-900 dark:text-white'>{c.id}</td>
                      <td className='py-3.5 text-slate-800 dark:text-slate-200 font-semibold'>{c.provider}</td>
                      <td className='py-3.5 text-right font-medium text-slate-700 dark:text-slate-300'>{formatCurrency(c.amount)}</td>
                      <td className='py-3.5 text-right font-extrabold text-slate-850 dark:text-slate-150'>{formatPercent(c.riskScore)}</td>
                      <td className='py-3.5 font-medium text-slate-600 dark:text-slate-450'>{c.assignedTo}</td>
                      <td className='py-3.5'>{getPriorityBadge(c.priority)}</td>
                      <td className='py-3.5'>{getStatusBadge(c.status)}</td>
                      <td className='py-3.5 text-right text-slate-450 dark:text-slate-500'>{new Date(c.created_at).toLocaleDateString()}</td>
                      <td className='py-3.5 text-center no-print' onClick={(e) => e.stopPropagation()}>
                        <button
                          type='button'
                          onClick={() => setSelectedCase(c)}
                          className='inline-flex items-center gap-0.5 text-[11px] font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline'
                        >
                          Audit File <ChevronRight className='h-3 w-3' />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {sortedCases.length > 0 && (
              <div className='flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-slate-800/80 dark:text-slate-400 mt-2 no-print'>
                <div>
                  Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedCases.length)} of {sortedCases.length} cases
                </div>
                <div className='flex items-center gap-1.5'>
                  <button
                    type='button'
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className='px-2.5 py-1 rounded-lg border border-slate-255 bg-white disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900'
                  >
                    Previous
                  </button>
                  <span className='px-1'>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type='button'
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className='px-2.5 py-1 rounded-lg border border-slate-255 bg-white disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900'
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Slide-over details drawer (No-print) */}
      <AnimatePresence>
        {selectedCase && (
          <CaseDrawer
            caseItem={activeCaseInDrawer}
            onClose={() => setSelectedCase(null)}
            onUpdateStatus={updateCaseStatus}
            onUpdateAssignment={updateCaseAssignment}
            onAddNote={addCaseNote}
          />
        )}
      </AnimatePresence>

    </section>
  )
}
