import { useEffect, useMemo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Activity, ShieldAlert, CheckCircle, Percent, Search, SlidersHorizontal, ChevronRight, X, Save, Eye, FileText, User } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useApi } from '@/hooks/useApi'
import { MetricCard } from '@/components/cards/MetricCard'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPercent } from '@/utils/format'
import { cn } from '@/utils/cn'

// Severity Distribution Donut Chart
function SeverityDonutChart({ data = [] }) {
  const COLORS = {
    Critical: '#f43f5e',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#10b981'
  }

  const chartData = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 }
    data.forEach(a => {
      if (counts[a.severity] !== undefined) {
        counts[a.severity] += 1
      }
    })
    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key],
      color: COLORS[key]
    })).filter(c => c.value > 0)
  }, [data])

  return (
    <div className='rounded-2xl border border-slate-200/80 bg-white/92 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 flex flex-col justify-between h-96'>
      <div>
        <h3 className='font-display text-sm font-semibold text-slate-900 dark:text-slate-100'>Severity Distribution</h3>
        <p className='text-xs text-slate-500 dark:text-slate-400'>Breakdown of alert priority ratings</p>
      </div>

      {chartData.length === 0 ? (
        <div className='flex-1 flex items-center justify-center text-xs text-slate-400'>No severity data</div>
      ) : (
        <>
          <div className='relative flex-1 flex items-center justify-center h-44 my-2'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={chartData}
                  cx='50%'
                  cy='50%'
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey='value'
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className='grid grid-cols-2 gap-1.5 mt-2'>
            {chartData.map((item) => (
              <span
                key={item.name}
                className='inline-flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-600 dark:border-slate-900 dark:bg-slate-900/40 dark:text-slate-350'
              >
                <span className='flex items-center gap-1.5'>
                  <span className='h-2 w-2 rounded-full' style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className='font-bold'>{item.value}</span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Alert Resolution Trends Chart
function AlertTrendsChart({ data = [] }) {
  const chartData = useMemo(() => {
    const grouped = {}
    data.forEach(a => {
      const dateStr = new Date(a.created_at).toISOString().split('T')[0]
      if (!grouped[dateStr]) {
        grouped[dateStr] = { date: dateStr, total: 0, resolved: 0 }
      }
      grouped[dateStr].total += 1
      if (a.status === 'Resolved') {
        grouped[dateStr].resolved += 1
      }
    })

    return Object.keys(grouped).sort().map(date => ({
      date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      'Total Alerts': grouped[date].total,
      'Resolved Alerts': grouped[date].resolved,
    }))
  }, [data])

  return (
    <div className='rounded-2xl border border-slate-200/80 bg-white/92 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 flex flex-col justify-between h-96 lg:col-span-2'>
      <div>
        <h3 className='font-display text-sm font-semibold text-slate-900 dark:text-slate-100'>Alert & Resolution Timeline</h3>
        <p className='text-xs text-slate-500 dark:text-slate-400'>Timeline trends of active vs resolved security incidents</p>
      </div>

      <div className='flex-1 h-56 mt-4'>
        {chartData.length === 0 ? (
          <div className='h-full flex items-center justify-center text-xs text-slate-400'>No trend data available</div>
        ) : (
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={chartData} margin={{ top: 8, right: 10, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id='alertArea' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='#f43f5e' stopOpacity={0.2} />
                  <stop offset='95%' stopColor='#f43f5e' stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id='resolvedArea' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='#10b981' stopOpacity={0.2} />
                  <stop offset='95%' stopColor='#10b981' stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray='4 4' stroke='#cbd5e1' opacity={0.4} />
              <XAxis dataKey='date' tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={36} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)',
                }}
              />
              <Area type='monotone' dataKey='Total Alerts' stroke='#f43f5e' strokeWidth={2} fill='url(#alertArea)' />
              <Area type='monotone' dataKey='Resolved Alerts' stroke='#10b981' strokeWidth={2} fill='url(#resolvedArea)' />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

// Slide-Over Detail Drawer Component
function AlertDrawer({ alertItem, onClose, onUpdateStatus, onUpdateNotes }) {
  const [status, setStatus] = useState(alertItem?.status || 'New')
  const [notes, setNotes] = useState(alertItem?.notes || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (alertItem) {
      setStatus(alertItem.status)
      setNotes(alertItem.notes || '')
    }
  }, [alertItem])

  if (!alertItem) return null

  const handleSave = () => {
    setSaving(true)
    onUpdateStatus(alertItem.id, status)
    onUpdateNotes(alertItem.id, notes)
    setTimeout(() => {
      setSaving(false)
    }, 400)
  }

  const getSeverityColor = (sev) => {
    if (sev === 'Critical') return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40'
    if (sev === 'High') return 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-900/40'
    if (sev === 'Medium') return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40'
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40'
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
          className='w-screen max-w-md bg-white shadow-2xl dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between'
        >
          {/* Header */}
          <div className='border-b border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800/80 dark:bg-slate-900/40 flex items-center justify-between'>
            <div>
              <h3 className='font-display text-base font-semibold text-slate-900 dark:text-slate-100'>
                Alert Audit Inspector
              </h3>
              <p className='text-xs text-slate-550 dark:text-slate-400'>{alertItem.id}</p>
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
          <div className='flex-1 overflow-y-auto p-6 space-y-6'>
            {/* Risk Probability progress block */}
            <div className='rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-850 dark:bg-slate-900/20 space-y-3'>
              <div className='flex items-center justify-between text-xs'>
                <span className='font-semibold text-slate-500'>Prediction Confidence</span>
                <span className='font-bold text-rose-600 dark:text-rose-400'>{formatPercent(alertItem.riskScore)}</span>
              </div>
              <div className='h-2 w-full rounded-full bg-slate-200 dark:bg-slate-850 overflow-hidden'>
                <div className='h-full bg-linear-to-r from-rose-500 to-rose-600 rounded-full' style={{ width: `${alertItem.riskScore * 100}%` }} />
              </div>
              <div className='flex justify-between items-center pt-1'>
                <span className='text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500'>Flagged Risk Rating</span>
                <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full', getSeverityColor(alertItem.severity))}>
                  {alertItem.severity} severity
                </span>
              </div>
            </div>

            {/* Claim info grid */}
            <div className='space-y-3.5'>
              <h4 className='text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500'>Claim Metadata</h4>
              <div className='grid grid-cols-2 gap-4 text-xs'>
                <div>
                  <span className='text-slate-400 font-medium block'>Claim Number</span>
                  <span className='font-semibold text-slate-800 dark:text-slate-200 mt-1 block'>{alertItem.claimId}</span>
                </div>
                <div>
                  <span className='text-slate-400 font-medium block'>Billing Provider</span>
                  <span className='font-semibold text-slate-800 dark:text-slate-200 mt-1 block'>{alertItem.provider}</span>
                </div>
                <div>
                  <span className='text-slate-400 font-medium block'>Claimed Amount</span>
                  <span className='font-semibold text-sky-600 dark:text-sky-400 mt-1 block'>{formatCurrency(alertItem.amount)}</span>
                </div>
                <div>
                  <span className='text-slate-400 font-medium block'>Procedures billed</span>
                  <span className='font-semibold text-slate-800 dark:text-slate-200 mt-1 block'>{alertItem.procedures}</span>
                </div>
                <div>
                  <span className='text-slate-400 font-medium block'>Patient Gender</span>
                  <span className='font-semibold text-slate-800 dark:text-slate-200 mt-1 block'>
                    {alertItem.gender === 'M' ? 'Male' : alertItem.gender === 'F' ? 'Female' : 'Other'}
                  </span>
                </div>
                <div>
                  <span className='text-slate-400 font-medium block'>Trigger Date</span>
                  <span className='font-semibold text-slate-850 dark:text-slate-200 mt-1 block'>
                    {new Date(alertItem.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Decision Analysis */}
            <div className='border-t border-slate-100 pt-5 dark:border-slate-800/80 space-y-2.5'>
              <h4 className='text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500'>Fraud Indicators</h4>
              <div className='space-y-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed'>
                <div className='flex items-start gap-2'>
                  <span className='mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500' />
                  <span>Outlier claim amount compared to patient demographic records.</span>
                </div>
                <div className='flex items-start gap-2'>
                  <span className='mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500' />
                  <span>Substantially elevated procedure code frequency mix.</span>
                </div>
                {alertItem.amount > 5000 && (
                  <div className='flex items-start gap-2'>
                    <span className='mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500' />
                    <span>Suspicious high-value claim band trigger threshold.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status updates selector */}
            <div className='border-t border-slate-100 pt-5 dark:border-slate-800/80 space-y-3.5'>
              <h4 className='text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500'>Investigation Status</h4>
              <div className='grid grid-cols-2 gap-2'>
                {['New', 'Under Review', 'Investigating', 'Resolved'].map((st) => (
                  <button
                    key={st}
                    type='button'
                    onClick={() => setStatus(st)}
                    className={cn(
                      'py-2 px-3 text-xs font-semibold rounded-xl border transition-all duration-200 text-center',
                      status === st
                        ? 'bg-sky-600 text-white border-transparent shadow-md shadow-sky-500/10'
                        : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800'
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Investigator Notes */}
            <div className='border-t border-slate-100 pt-5 dark:border-slate-800/80 space-y-2'>
              <label htmlFor='investigator-notes' className='text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 block'>
                Investigator Action Logs / Notes
              </label>
              <textarea
                id='investigator-notes'
                rows={3}
                placeholder='Record audits, provider interviews, or audit trail updates...'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className='w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:bg-slate-950'
              />
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className='border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-900/40 flex justify-end gap-2'>
            <button
              type='button'
              onClick={onClose}
              className='py-2 px-4 text-xs font-medium rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={handleSave}
              disabled={saving}
              className='py-2 px-4 text-xs font-bold text-white rounded-xl bg-sky-600 hover:bg-sky-700 transition flex items-center gap-1.5 shadow-sm'
            >
              <Save className='h-3.5 w-3.5' /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function Alerts() {
  const alerts = useStore((state) => state.alerts)
  const setAlerts = useStore((state) => state.setAlerts)
  const updateAlertStatus = useStore((state) => state.updateAlertStatus)
  const updateAlertNotes = useStore((state) => state.updateAlertNotes)
  const history = useStore((state) => state.history)
  const loadingHistory = useStore((state) => state.loadingByKey?.history)
  const { fetchHistory } = useApi()

  // State
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [search, setSearch] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState({ key: 'riskScore', direction: 'desc' })
  const pageSize = 8

  // Sync / fetch history
  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Initialize store alerts from prediction history if empty
  useEffect(() => {
    if (history && history.length > 0 && (!alerts || alerts.length === 0)) {
      const generatedAlerts = history
        .map((item, idx) => {
          const claim = item.claim || {}
          const pred = item.latest_prediction || {}
          const isFraud = pred.prediction === 1
          
          if (!isFraud) return null
          
          const riskScore = pred.confidence || 0
          let severity = 'Low'
          if (riskScore >= 0.90) severity = 'Critical'
          else if (riskScore >= 0.75) severity = 'High'
          else if (riskScore >= 0.50) severity = 'Medium'
          
          return {
            id: `AL-88${String(idx + 1).padStart(3, '0')}`,
            claimId: claim.id,
            provider: claim.provider || 'Unknown Provider',
            amount: claim.claim_amount || 0,
            procedures: claim.num_procedures || 1,
            gender: claim.gender || 'O',
            riskScore: riskScore,
            severity: severity,
            status: 'New',
            notes: '',
            created_at: claim.created_at || new Date().toISOString()
          }
        })
        .filter(Boolean)
      
      setAlerts(generatedAlerts)
    } else if ((!history || history.length === 0) && (!alerts || alerts.length === 0)) {
      // Fallback mocks
      const providers = ['Provider A', 'Provider B', 'Provider C', 'Provider D']
      const genders = ['M', 'F', 'O']
      const severities = ['Critical', 'High', 'Medium', 'Low']
      const statuses = ['New', 'Under Review', 'Investigating', 'Resolved']
      
      const mockAlerts = Array.from({ length: 18 }).map((_, idx) => {
        const amount = Math.round(1800 * (0.6 + (idx % 6) * 0.25) + (idx % 3) * 350)
        const confidence = 0.45 + (idx % 10) * 0.055
        
        let severity = 'Low'
        if (confidence >= 0.90) severity = 'Critical'
        else if (confidence >= 0.75) severity = 'High'
        else if (confidence >= 0.50) severity = 'Medium'
        
        const dateStr = new Date(2026, 4, 1 + (idx % 28), 9 + (idx % 6), 10 + (idx % 45)).toISOString()
        
        return {
          id: `AL-99${String(idx + 1).padStart(3, '0')}`,
          claimId: `CL-77${String(idx + 1).padStart(3, '0')}`,
          provider: providers[idx % providers.length],
          amount: amount,
          procedures: (idx % 3) + 1,
          gender: genders[idx % genders.length],
          riskScore: confidence,
          severity: severity,
          status: statuses[idx % statuses.length],
          notes: idx % 3 === 0 ? 'Billing volume spiked in 10-minute window.' : '',
          created_at: dateStr
        }
      })
      setAlerts(mockAlerts)
    }
  }, [history, alerts, setAlerts])

  // Overview metrics
  const stats = useMemo(() => {
    if (!alerts || alerts.length === 0) return { total: 0, critical: 0, resolved: 0, avgRisk: 0 }
    const total = alerts.length
    const critical = alerts.filter(a => a.severity === 'Critical').length
    const resolved = alerts.filter(a => a.status === 'Resolved').length
    const sumRisk = alerts.reduce((acc, a) => acc + a.riskScore, 0)
    return {
      total,
      critical,
      resolved,
      avgRisk: sumRisk / total
    }
  }, [alerts])

  // Filtering Logic
  const filteredAlerts = useMemo(() => {
    if (!alerts) return []
    return alerts.filter(item => {
      // Search
      const textMatch = item.id.toLowerCase().includes(search.toLowerCase()) ||
                        item.provider.toLowerCase().includes(search.toLowerCase()) ||
                        item.claimId.toLowerCase().includes(search.toLowerCase())
      if (!textMatch) return false
      
      // Severity Filter
      if (filterSeverity !== 'All' && item.severity !== filterSeverity) return false

      // Status Filter
      if (filterStatus !== 'All' && item.status !== filterStatus) return false

      return true
    })
  }, [alerts, search, filterSeverity, filterStatus])

  // Sorting
  const sortedAlerts = useMemo(() => {
    if (!sortConfig.key) return filteredAlerts
    return [...filteredAlerts].sort((a, b) => {
      let valA = a[sortConfig.key]
      let valB = b[sortConfig.key]
      if (typeof valA === 'string') {
        return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
      }
      return sortConfig.direction === 'asc' ? valA - valB : valB - valA
    })
  }, [filteredAlerts, sortConfig])

  // Pagination
  const paginatedAlerts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedAlerts.slice(start, start + pageSize)
  }, [sortedAlerts, currentPage])

  const totalPages = Math.max(1, Math.ceil(sortedAlerts.length / pageSize))

  const handleRequestSort = (key) => {
    let direction = 'desc'
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc'
    }
    setSortConfig({ key, direction })
  }

  const handleResetFilters = () => {
    setSearch('')
    setFilterSeverity('All')
    setFilterStatus('All')
    setCurrentPage(1)
  }

  const getSeverityBadge = (sev) => {
    if (sev === 'Critical') return <span className='inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700 dark:bg-rose-950/40 dark:text-rose-350'>Critical</span>
    if (sev === 'High') return <span className='inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-700 dark:bg-orange-950/40 dark:text-orange-350'>High</span>
    if (sev === 'Medium') return <span className='inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'>Medium</span>
    return <span className='inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-350'>Low</span>
  }

  const getStatusBadge = (st) => {
    if (st === 'Resolved') return <span className='inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'><CheckCircle className='h-3 w-3' /> Resolved</span>
    if (st === 'Investigating') return <span className='inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-700 dark:bg-sky-950/20 dark:text-sky-450'><Activity className='h-3 w-3' /> Investigating</span>
    if (st === 'Under Review') return <span className='inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-950/20 dark:text-amber-450'><Eye className='h-3 w-3' /> Review</span>
    return <span className='inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-350'><FileText className='h-3 w-3' /> New</span>
  }

  // Loader Skeletons
  if (loadingHistory && (!alerts || alerts.length === 0)) {
    return (
      <section className='space-y-6'>
        {/* KPI Cards Skeletons */}
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

        {/* Charts & Tables Skeletons */}
        <div className='grid gap-6 xl:grid-cols-3'>
          <div className='xl:col-span-2 rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-950/80 h-96' />
          <div className='rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-950/80 h-96' />
        </div>
      </section>
    )
  }

  return (
    <section className='space-y-6'>
      
      {/* Overview Head */}
      <div className='rounded-2xl border border-slate-200/80 bg-linear-to-r from-rose-50 via-white to-sky-50/40 p-5 shadow-xs dark:border-slate-850 dark:from-rose-950/20 dark:via-slate-950/50 dark:to-sky-950/15'>
        <p className='text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-450'>Investigation Workspace</p>
        <h2 className='mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white'>Fraud Alert Command</h2>
        <p className='mt-1 max-w-3xl text-sm text-slate-550 dark:text-slate-400'>
          Triage anomalies, monitor provider risk thresholds, and record investigation logs for predicted billing infractions.
        </p>
      </div>

      {/* KPI Overview row */}
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <MetricCard
          title='Total Alerts'
          value={stats.total}
          subtitle='Active monitoring queue'
          icon={ShieldAlert}
          delay={0}
        />
        <MetricCard
          title='Critical Alerts'
          value={stats.critical}
          subtitle='Severity probability >= 90%'
          icon={ShieldAlert}
          delay={0.06}
        />
        <MetricCard
          title='Resolved Alerts'
          value={stats.resolved}
          subtitle='Audits concluded'
          icon={CheckCircle}
          delay={0.12}
        />
        <MetricCard
          title='Average Risk Score'
          value={formatPercent(stats.avgRisk)}
          subtitle='Global confidence index'
          icon={Percent}
          delay={0.18}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className='grid gap-6 lg:grid-cols-3'>
        <AlertTrendsChart data={alerts} />
        <SeverityDonutChart data={alerts} />
      </div>

      {/* Alerts Queue Control and list */}
      <div className='rounded-2xl border border-slate-200/80 bg-white/92 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 space-y-4'>
        
        {/* Table Controls */}
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <h3 className='font-display text-base font-semibold text-slate-900 dark:text-slate-100'>Investigation Queue</h3>
            <p className='text-xs text-slate-500 dark:text-slate-400'>Search, filter, and audit flagged predictions</p>
          </div>
          
          <div className='flex flex-wrap items-center gap-3 w-full lg:w-auto'>
            {/* Search Input */}
            <div className='relative w-full sm:w-64'>
              <Search className='absolute top-2.5 left-3 h-4 w-4 text-slate-400' />
              <input
                type='text'
                placeholder='Search Alert ID, Provider...'
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className='h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:bg-slate-950'
              />
            </div>

            {/* Severity Filter */}
            <select
              value={filterSeverity}
              onChange={(e) => { setFilterSeverity(e.target.value); setCurrentPage(1); }}
              className='h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350'
            >
              <option value='All'>All Severities</option>
              <option value='Critical'>Critical Only</option>
              <option value='High'>High Only</option>
              <option value='Medium'>Medium Only</option>
              <option value='Low'>Low Only</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className='h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350'
            >
              <option value='All'>All Statuses</option>
              <option value='New'>New</option>
              <option value='Under Review'>Under Review</option>
              <option value='Investigating'>Investigating</option>
              <option value='Resolved'>Resolved</option>
            </select>

            {/* Reset Filter Button */}
            {(search || filterSeverity !== 'All' || filterStatus !== 'All') && (
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

        {/* Alerts List Table */}
        <div className='overflow-x-auto border-t border-slate-100 pt-3 dark:border-slate-800/60'>
          <table className='w-full text-left text-xs'>
            <thead>
              <tr className='border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:border-slate-800/40 dark:text-slate-500'>
                <th className='py-3'>Alert ID</th>
                <th className='py-3'>Claim ID</th>
                <th className='py-3'>Provider</th>
                <th className='py-3 text-right cursor-pointer hover:text-slate-600 dark:hover:text-slate-300' onClick={() => handleRequestSort('amount')}>
                  Amount <span className='text-[9px]'>{sortConfig.key === 'amount' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th className='py-3 text-right cursor-pointer hover:text-slate-600 dark:hover:text-slate-300' onClick={() => handleRequestSort('riskScore')}>
                  Risk Score <span className='text-[9px]'>{sortConfig.key === 'riskScore' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th className='py-3'>Severity</th>
                <th className='py-3'>Status</th>
                <th className='py-3 text-right cursor-pointer hover:text-slate-600 dark:hover:text-slate-300' onClick={() => handleRequestSort('created_at')}>
                  Date <span className='text-[9px]'>{sortConfig.key === 'created_at' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th className='py-3 text-center'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100 dark:divide-slate-900'>
              {paginatedAlerts.length === 0 ? (
                <tr>
                  <td colSpan={9} className='py-12'>
                    <EmptyState
                      title='No Alerts Found'
                      description='No active alerts match the search query or filtering constraints.'
                      action={
                        <button
                          type='button'
                          onClick={handleResetFilters}
                          className='rounded-xl bg-sky-600 px-3 py-1.5 text-xs text-white'
                        >
                          Clear Filters
                        </button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                paginatedAlerts.map((a) => (
                  <tr
                    key={a.id}
                    className={cn(
                      'hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors cursor-pointer',
                      selectedAlert?.id === a.id ? 'bg-sky-50/20 dark:bg-sky-950/10' : ''
                    )}
                    onClick={() => setSelectedAlert(a)}
                  >
                    <td className='py-3 font-bold text-slate-900 dark:text-white'>{a.id}</td>
                    <td className='py-3 text-slate-550 dark:text-slate-400'>{a.claimId}</td>
                    <td className='py-3 font-semibold text-slate-700 dark:text-slate-300'>{a.provider}</td>
                    <td className='py-3 text-right text-slate-700 dark:text-slate-300 font-medium'>{formatCurrency(a.amount)}</td>
                    <td className='py-3 text-right font-bold text-slate-800 dark:text-slate-200'>{formatPercent(a.riskScore)}</td>
                    <td className='py-3'>{getSeverityBadge(a.severity)}</td>
                    <td className='py-3'>{getStatusBadge(a.status)}</td>
                    <td className='py-3 text-right text-slate-450 dark:text-slate-500'>{new Date(a.created_at).toLocaleDateString()}</td>
                    <td className='py-3 text-center'>
                      <button
                        type='button'
                        className='inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline'
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedAlert(a)
                        }}
                      >
                        Inspect <ChevronRight className='h-3 w-3' />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination segment */}
        {sortedAlerts.length > 0 && (
          <div className='flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-slate-800/80 dark:text-slate-400'>
            <div>
              Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedAlerts.length)} of {sortedAlerts.length} alerts
            </div>
            <div className='flex items-center gap-1.5'>
              <button
                type='button'
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className='px-2.5 py-1 rounded-lg border border-slate-250 bg-white disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900'
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
                className='px-2.5 py-1 rounded-lg border border-slate-250 bg-white disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900'
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Drawer Panel */}
      <AnimatePresence>
        {selectedAlert && (
          <AlertDrawer
            alertItem={selectedAlert}
            onClose={() => setSelectedAlert(null)}
            onUpdateStatus={updateAlertStatus}
            onUpdateNotes={updateAlertNotes}
          />
        )}
      </AnimatePresence>

    </section>
  )
}
