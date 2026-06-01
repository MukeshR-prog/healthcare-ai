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
  Hospital,
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
  Eye,
  Info,
  DollarSign,
  TrendingUp,
  Star
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useApi } from '@/hooks/useApi'
import { healthcareApi } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency, formatPercent } from '@/utils/format'
import { cn } from '@/utils/cn'

// Severity/Risk Level Colors helper
const getRiskBadge = (level) => {
  if (level === 'Critical') return <span className='inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-rose-700 dark:bg-rose-950/40 dark:text-rose-350'>Critical</span>
  if (level === 'High') return <span className='inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-orange-700 dark:bg-orange-950/40 dark:text-orange-350'>High</span>
  if (level === 'Medium') return <span className='inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'>Medium</span>
  return <span className='inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-350'>Low</span>
}

const getRiskColor = (score) => {
  if (score >= 75) return '#f43f5e' // Rose
  if (score >= 50) return '#f97316' // Orange
  if (score >= 25) return '#eab308' // Amber
  return '#10b981' // Emerald
}

// Slide-Over Provider Drawer Component
function ProviderDrawer({ providerItem, onClose, watchlistActive, onToggleWatchlist, flagText, onSaveFlag }) {
  const [flag, setFlag] = useState(flagText || '')
  
  useEffect(() => {
    setFlag(flagText || '')
  }, [flagText])

  if (!providerItem) return null

  const handleSaveFlag = (e) => {
    e.preventDefault()
    onSaveFlag(providerItem.name, flag)
  }

  const riskColor = getRiskColor(providerItem.riskScore)

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
            <div className='flex items-center gap-3'>
              <div className='grid h-10 w-10 place-items-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-500/20'>
                <Hospital className='h-5 w-5' />
              </div>
              <div>
                <h3 className='font-display text-base font-bold text-slate-900 dark:text-slate-100'>
                  {providerItem.name}
                </h3>
                <p className='text-xs text-slate-400 font-semibold mt-0.5'>Healthcare Billing Profile</p>
              </div>
            </div>
            
            <div className='flex items-center gap-2'>
              {/* Watchlist toggle */}
              <button
                type='button'
                onClick={() => onToggleWatchlist(providerItem.name)}
                className={cn(
                  'grid h-9 w-9 place-items-center rounded-xl border transition shadow-xs',
                  watchlistActive
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 dark:bg-amber-950/40'
                    : 'bg-slate-50 border-slate-200 text-slate-450 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800'
                )}
                title={watchlistActive ? 'Remove from Watchlist' : 'Add to Watchlist'}
              >
                <Star className={cn('h-4.5 w-4.5', watchlistActive ? 'fill-amber-500' : '')} />
              </button>

              <button
                type='button'
                onClick={onClose}
                className='grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400'
              >
                <X className='h-4.5 w-4.5' />
              </button>
            </div>
          </div>

          {/* Drawer Body Scroll */}
          <div className='flex-1 overflow-y-auto p-5 space-y-6 scrollbar-none'>
            
            {/* Risk Gauge Row */}
            <div className='grid grid-cols-[120px_minmax(0,1fr)] gap-4 items-center bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-900'>
              {/* SVG circular risk indicator */}
              <div className='relative h-24 w-24 flex items-center justify-center'>
                <svg className='w-full h-full transform -rotate-90' viewBox='0 0 100 100'>
                  <circle
                    cx='50'
                    cy='50'
                    r='42'
                    stroke='#cbd5e1'
                    className='dark:stroke-slate-800'
                    strokeWidth='8'
                    fill='transparent'
                  />
                  <motion.circle
                    cx='50'
                    cy='50'
                    r='42'
                    stroke={riskColor}
                    strokeWidth='8'
                    fill='transparent'
                    strokeDasharray={263.8}
                    initial={{ strokeDashoffset: 263.8 }}
                    animate={{ strokeDashoffset: 263.8 - (263.8 * providerItem.riskScore) / 100 }}
                    transition={{ duration: 0.8 }}
                    strokeLinecap='round'
                  />
                </svg>
                <div className='absolute flex flex-col items-center justify-center text-center'>
                  <span className='font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white'>
                    {providerItem.riskScore}
                  </span>
                  <span className='text-[8px] font-bold text-slate-400 uppercase tracking-wider'>
                    Risk Score
                  </span>
                </div>
              </div>

              <div className='space-y-1.5'>
                <div className='flex items-center gap-2'>
                  <span className='text-xs font-bold text-slate-400 uppercase tracking-wider'>Status Band:</span>
                  {getRiskBadge(providerItem.riskLevel)}
                </div>
                <p className='text-xs text-slate-500 dark:text-slate-450 leading-relaxed'>
                  This composite index aggregates fraud rate ({formatPercent(providerItem.fraudRate)}), alert density ({providerItem.alertCount} triggers), and claims volume ({providerItem.claimsCount} claims).
                </p>
              </div>
            </div>

            {/* Profile Statistics Grid */}
            <div className='space-y-3.5'>
              <h4 className='text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500'>Metrics Summary</h4>
              <div className='grid grid-cols-2 gap-3 text-xs font-semibold text-slate-700 dark:text-slate-350'>
                <div className='p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-900'>
                  <span className='text-[9px] font-bold text-slate-400 block uppercase mb-0.5'>Total Claims billing</span>
                  <span className='text-slate-900 dark:text-slate-100 block mt-0.5'>{providerItem.claimsCount}</span>
                </div>
                <div className='p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-900'>
                  <span className='text-[9px] font-bold text-slate-400 block uppercase mb-0.5'>Total Claims value</span>
                  <span className='text-sky-600 dark:text-sky-400 block mt-0.5'>{formatCurrency(providerItem.totalClaimAmount)}</span>
                </div>
                <div className='p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-900'>
                  <span className='text-[9px] font-bold text-slate-400 block uppercase mb-0.5'>Predicted Fraud cases</span>
                  <span className='text-rose-500 block mt-0.5'>{providerItem.fraudCount} claims</span>
                </div>
                <div className='p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-900'>
                  <span className='text-[9px] font-bold text-slate-400 block uppercase mb-0.5'>Average Claim amount</span>
                  <span className='text-slate-900 dark:text-slate-100 block mt-0.5'>{formatCurrency(providerItem.avgClaimAmount)}</span>
                </div>
              </div>
            </div>

            {/* Analyst Review Flags */}
            <div className='border-t border-slate-100 pt-5 dark:border-slate-800/80 space-y-3'>
              <label htmlFor='provider-flag' className='text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 block'>
                Analyst Compliance Flag & Notes
              </label>
              <form onSubmit={handleSaveFlag} className='space-y-3.5'>
                <textarea
                  id='provider-flag'
                  rows={2}
                  placeholder='Record flag observations, upcoding incidents, or manual audit schedules...'
                  value={flag}
                  onChange={(e) => setFlag(e.target.value)}
                  className='w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-slate-850 dark:bg-slate-900 dark:text-slate-200'
                />
                <div className='flex justify-end'>
                  <button
                    type='submit'
                    onClick={handleSaveFlag}
                    className='py-1.5 px-3.5 text-[11px] font-bold bg-sky-650 text-white rounded-xl hover:bg-sky-700 transition flex items-center gap-1.5'
                  >
                    <Check className='h-3.5 w-3.5' /> Save Flag
                  </button>
                </div>
              </form>
            </div>

            {/* Provider Risk Timeline */}
            <div className='border-t border-slate-100 pt-5 dark:border-slate-800/80 space-y-4'>
              <h4 className='text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500'>Risk Timeline & Log Actions</h4>
              
              {providerItem.riskTimeline.length === 0 ? (
                <div className='text-center py-4 text-xs text-slate-450 italic'>No timelines events registered on provider.</div>
              ) : (
                <div className='relative pl-5 space-y-4 border-l border-slate-200 dark:border-slate-800 ml-2'>
                  {providerItem.riskTimeline.slice(0, 5).map((t, idx) => (
                    <div key={`timeline-log-${idx}`} className='relative'>
                      <div className={cn(
                        'absolute -left-[27px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center shrink-0',
                        t.type === 'alert' ? 'bg-amber-500' : t.type === 'case' ? 'bg-rose-500' : 'bg-emerald-500'
                      )} />
                      <div>
                        <div className='flex items-center justify-between text-xs font-semibold'>
                          <span className='text-slate-800 dark:text-slate-250'>{t.title}</span>
                          <span className='text-[9px] text-slate-450 font-medium'>{new Date(t.date).toLocaleDateString()}</span>
                        </div>
                        <p className='text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug'>
                          {t.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Drawer Footer Actions */}
          <div className='border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-900/40 flex justify-end gap-2'>
            <button
              type='button'
              onClick={onClose}
              className='py-2 px-4 text-xs font-bold bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition shadow-xs'
            >
              Close Profile
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function Providers() {
  const providers = useStore((state) => state.providers || [])
  const providerMetrics = useStore((state) => state.providerMetrics)

  const toggleWatchlist = useStore((state) => state.toggleWatchlist)
  const setProviderFlag = useStore((state) => state.setProviderFlag)

  const loading = useStore((state) => state.loadingByKey?.providers)
  const { fetchProviders, fetchProviderMetrics, fetchProviderTrends } = useApi()

  // Selection & Filters
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [search, setSearch] = useState('')
  const [filterRiskLevel, setFilterRiskLevel] = useState('All')
  const [filterWatchlist, setFilterWatchlist] = useState('All') // All, Watchlist Only
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState('riskScore')
  const [sortDirection, setSortDirection] = useState('desc')
  const pageSize = 8

  // Comparisons selection state
  const [compareList, setCompareList] = useState([])
  const [drawerProvider, setDrawerProvider] = useState(null)

  // Load backend data on mount
  useEffect(() => {
    fetchProviders()
    fetchProviderMetrics()
    fetchProviderTrends()
  }, [fetchProviders, fetchProviderMetrics, fetchProviderTrends])

  // Load single provider details dynamically on drawer activation
  useEffect(() => {
    if (selectedProvider) {
      healthcareApi.getProviderDetail(selectedProvider.name)
        .then(res => setDrawerProvider(res.data))
        .catch(err => console.error("Failed to load provider details:", err))
    } else {
      setDrawerProvider(null)
    }
  }, [selectedProvider])

  // Handle reset filters
  const handleResetFilters = () => {
    setSearch('')
    setFilterRiskLevel('All')
    setFilterWatchlist('All')
    setCurrentPage(1)
  }

  // Final list maps straight to store state
  const finalProviders = useMemo(() => {
    return providers
  }, [providers])

  // Overview stats
  const stats = useMemo(() => {
    if (providerMetrics) {
      return providerMetrics
    }
    const total = finalProviders.length
    if (total === 0) return { total: 0, highRiskCount: 0, activeCases: 0, avgRisk: 0 }

    let highRiskCount = 0
    let activeCases = 0
    let sumRisk = 0

    finalProviders.forEach(p => {
      sumRisk += p.riskScore
      if (p.riskScore >= 70) highRiskCount++
      activeCases += p.investigationCount - p.resolvedCount
    })

    return {
      total,
      highRiskCount,
      activeCases,
      avgRisk: sumRisk / total
    }
  }, [finalProviders, providerMetrics])

  // Filtering list
  const filteredProviders = useMemo(() => {
    return finalProviders.filter((p) => {
      // Search matches
      const textMatch = p.name.toLowerCase().includes(search.toLowerCase())
      if (!textMatch) return false

      // Filters
      if (filterRiskLevel !== 'All' && p.riskLevel !== filterRiskLevel) return false
      if (filterWatchlist === 'Watchlist Only' && !p.watchlist) return false

      return true
    })
  }, [finalProviders, search, filterRiskLevel, filterWatchlist])

  // Sorting
  const sortedProviders = useMemo(() => {
    return [...filteredProviders].sort((a, b) => {
      let valA = a[sortField]
      let valB = b[sortField]

      if (typeof valA === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
      }
      return sortDirection === 'asc' ? valA - valB : valB - valA
    })
  }, [filteredProviders, sortField, sortDirection])

  // Pagination
  const paginatedProviders = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedProviders.slice(start, start + pageSize)
  }, [sortedProviders, currentPage])

  const totalPages = Math.max(1, Math.ceil(sortedProviders.length / pageSize))

  const handleRequestSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Comparison selection
  const handleToggleCompare = (providerName) => {
    setCompareList(prev => {
      if (prev.includes(providerName)) {
        return prev.filter(x => x !== providerName)
      }
      if (prev.length >= 3) return prev // Max 3
      return [...prev, providerName]
    })
  }

  const comparisonData = useMemo(() => {
    return finalProviders.filter(p => compareList.includes(p.name))
  }, [compareList, finalProviders])

  // Recharts: Workload/Trends
  const comparisonChartData = useMemo(() => {
    return finalProviders.map(p => ({
      name: p.name,
      'Risk Score': p.riskScore,
      'Fraud Cases': p.fraudCount,
      'Claims Value (k$)': Math.round(p.totalClaimAmount / 1000)
    })).sort((a,b) => b['Risk Score'] - a['Risk Score'])
  }, [finalProviders])

  // Dynamic drawer details selector
  const activeProviderInDrawer = useMemo(() => {
    if (!selectedProvider) return null
    return drawerProvider || finalProviders.find(p => p.name === selectedProvider.name) || null
  }, [selectedProvider, drawerProvider, finalProviders])

  // Exporters
  const handleExportCSV = () => {
    if (filteredProviders.length === 0) return
    const headers = ['Provider Name', 'Claims Count', 'Claims Value', 'Fraud Claims', 'Active Alerts', 'Investigation Count', 'Resolved Cases', 'Fraud Rate %', 'Risk Score (0-100)', 'Risk Level', 'Watchlist Status', 'Custom Flag']
    const rows = filteredProviders.map(p => [
      `"${p.name}"`,
      p.claimsCount,
      p.totalClaimAmount,
      p.fraudCount,
      p.alertCount,
      p.investigationCount,
      p.resolvedCount,
      (p.fraudRate * 100).toFixed(1),
      p.riskScore,
      p.riskLevel,
      p.watchlist ? 'Yes' : 'No',
      `"${p.flag}"`
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Providers_Risk_Intelligence_Export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    window.print()
  }

  // Skeletons
  if (loading && finalProviders.length === 0) {
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
      {/* Print media stylesheet */}
      <style>{`
        @media print {
          aside, nav, header, .no-print, button, select, input {
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

      {/* Header Panel (No-print) */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-[linear-gradient(to_right,#e0f2fe,#f0f9ff,#ffffff)] p-5 shadow-xs dark:border-slate-800/90 dark:bg-[linear-gradient(to_right,rgba(14,165,233,0.18),rgba(8,47,73,0.2),rgba(2,6,23,0.6))] no-print'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-350 flex items-center gap-1.5'>
            <Hospital className='h-3.5 w-3.5 text-sky-500 animate-pulse' />
            Demographics & Provider Audit Workspace
          </p>
          <h2 className='mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white'>Provider Risk Intelligence Observatory</h2>
          <p className='mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-350'>
            Isolate aberrant billing provider behaviors, track risk ranking leaderboards, flag watchlist infractions, and compare provider patterns.
          </p>
        </div>
        <div className='flex flex-wrap gap-2 sm:self-center shrink-0'>
          <button
            type='button'
            onClick={handleExportPDF}
            className='inline-flex items-center gap-1.5 rounded-xl border border-slate-250 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-55 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/90 transition shadow-xs'
          >
            <Printer className='h-3.5 w-3.5' />
            Print Reports
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

      {/* KPI Cards Row (No-print) */}
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4 no-print'>
        <div className='relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/92 p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/80 group'>
          <div className='absolute inset-0 bg-linear-to-br from-sky-500/10 via-transparent to-transparent -z-10 opacity-30 dark:opacity-20' />
          <div className='flex items-center justify-between'>
            <p className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500'>Total Providers</p>
            <div className='grid h-9 w-9 place-items-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-500/20 shadow-xs'>
              <Hospital className='h-4.5 w-4.5' />
            </div>
          </div>
          <p className='font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-3.5'>{stats.total}</p>
          <p className='text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2'>Billing entities registered</p>
        </div>

        <div className='relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/92 p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/80 group'>
          <div className='absolute inset-0 bg-linear-to-br from-rose-500/10 via-transparent to-transparent -z-10 opacity-30 dark:opacity-20' />
          <div className='flex items-center justify-between'>
            <p className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500'>High Risk Providers</p>
            <div className='grid h-9 w-9 place-items-center rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-500/20 shadow-xs'>
              <ShieldAlert className='h-4.5 w-4.5 animate-bounce' />
            </div>
          </div>
          <p className='font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-3.5'>{stats.highRiskCount}</p>
          <p className='text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2'>Risk score threshold &ge; 70</p>
        </div>

        <div className='relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/92 p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/80 group'>
          <div className='absolute inset-0 bg-linear-to-br from-orange-500/10 via-transparent to-transparent -z-10 opacity-30 dark:opacity-20' />
          <div className='flex items-center justify-between'>
            <p className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500'>Active Investigations</p>
            <div className='grid h-9 w-9 place-items-center rounded-2xl bg-orange-500/10 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-500/20 shadow-xs'>
              <Activity className='h-4.5 w-4.5' />
            </div>
          </div>
          <p className='font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-3.5'>{stats.activeCases}</p>
          <p className='text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2'>Ongoing compliance case escalations</p>
        </div>

        <div className='relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/92 p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/80 group'>
          <div className='absolute inset-0 bg-linear-to-br from-emerald-500/10 via-transparent to-transparent -z-10 opacity-30 dark:opacity-20' />
          <div className='flex items-center justify-between'>
            <p className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500'>Avg Risk Index</p>
            <div className='grid h-9 w-9 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20 shadow-xs'>
              <Percent className='h-4.5 w-4.5' />
            </div>
          </div>
          <p className='font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-3.5'>{Math.round(stats.avgRisk)}%</p>
          <p className='text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2'>Mean composite risk rating</p>
        </div>
      </div>

      {/* Analytics Charts & Heatmaps Row (No-print) */}
      <div className='grid gap-6 lg:grid-cols-3 no-print'>
        
        {/* Interactive Heatmap Visual Grid */}
        <Card className='h-96 flex flex-col justify-between'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5'>
              Risk Matrix Density Grid
              <Info className='h-3 w-3 text-slate-450' title='X-axis: Alert Density, Y-axis: Avg Claim Cost' />
            </CardTitle>
          </CardHeader>
          <CardContent className='flex-1 flex flex-col justify-between pb-4 pt-1'>
            {/* Heatmap display mapping */}
            <div className='flex-1 grid grid-cols-2 grid-rows-2 gap-2 mt-2 p-1.5 rounded-xl border border-slate-100 dark:border-slate-900/60 bg-slate-50/30 dark:bg-slate-900/10'>
              
              {/* Critical quadrant */}
              <div className='relative rounded-xl border border-rose-500/10 bg-rose-500/5 dark:bg-rose-950/5 flex flex-col items-center justify-center p-2 text-center'>
                <span className='text-[9px] uppercase tracking-wide font-extrabold text-rose-500 mb-1.5'>High Risk Outliers</span>
                <div className='flex flex-wrap justify-center gap-1 max-w-[120px]'>
                  {finalProviders.filter(p => p.riskScore >= 70).map(p => (
                    <span
                      key={`quad-c-${p.name}`}
                      onClick={() => setSelectedProvider(p)}
                      className='px-2 py-0.5 rounded-lg text-[9px] font-bold bg-rose-500 text-white cursor-pointer hover:scale-105 transition-all shadow-xs'
                    >
                      {p.name}
                    </span>
                  ))}
                  {finalProviders.filter(p => p.riskScore >= 70).length === 0 && (
                    <span className='text-[9px] text-slate-400 italic'>None</span>
                  )}
                </div>
              </div>

              {/* High risk quadrant */}
              <div className='relative rounded-xl border border-orange-500/10 bg-orange-500/5 dark:bg-orange-950/5 flex flex-col items-center justify-center p-2 text-center'>
                <span className='text-[9px] uppercase tracking-wide font-extrabold text-orange-500 mb-1.5'>Elevated Risk</span>
                <div className='flex flex-wrap justify-center gap-1 max-w-[120px]'>
                  {finalProviders.filter(p => p.riskScore >= 50 && p.riskScore < 70).map(p => (
                    <span
                      key={`quad-h-${p.name}`}
                      onClick={() => setSelectedProvider(p)}
                      className='px-2 py-0.5 rounded-lg text-[9px] font-bold bg-orange-500 text-white cursor-pointer hover:scale-105 transition-all shadow-xs'
                    >
                      {p.name}
                    </span>
                  ))}
                  {finalProviders.filter(p => p.riskScore >= 50 && p.riskScore < 70).length === 0 && (
                    <span className='text-[9px] text-slate-400 italic'>None</span>
                  )}
                </div>
              </div>

              {/* Medium risk quadrant */}
              <div className='relative rounded-xl border border-amber-500/10 bg-amber-500/5 dark:bg-amber-950/5 flex flex-col items-center justify-center p-2 text-center'>
                <span className='text-[9px] uppercase tracking-wide font-extrabold text-amber-500 mb-1.5'>Moderate risk</span>
                <div className='flex flex-wrap justify-center gap-1 max-w-[120px]'>
                  {finalProviders.filter(p => p.riskScore >= 25 && p.riskScore < 50).map(p => (
                    <span
                      key={`quad-m-${p.name}`}
                      onClick={() => setSelectedProvider(p)}
                      className='px-2 py-0.5 rounded-lg text-[9px] font-bold bg-amber-500 text-slate-900 cursor-pointer hover:scale-105 transition-all shadow-xs'
                    >
                      {p.name}
                    </span>
                  ))}
                  {finalProviders.filter(p => p.riskScore >= 25 && p.riskScore < 50).length === 0 && (
                    <span className='text-[9px] text-slate-400 italic'>None</span>
                  )}
                </div>
              </div>

              {/* Low risk quadrant */}
              <div className='relative rounded-xl border border-emerald-500/10 bg-emerald-500/5 dark:bg-emerald-950/5 flex flex-col items-center justify-center p-2 text-center'>
                <span className='text-[9px] uppercase tracking-wide font-extrabold text-emerald-500 mb-1.5'>Safe Baseline</span>
                <div className='flex flex-wrap justify-center gap-1 max-w-[120px]'>
                  {finalProviders.filter(p => p.riskScore < 25).map(p => (
                    <span
                      key={`quad-l-${p.name}`}
                      onClick={() => setSelectedProvider(p)}
                      className='px-2 py-0.5 rounded-lg text-[9px] font-bold bg-emerald-500 text-white cursor-pointer hover:scale-105 transition-all shadow-xs'
                    >
                      {p.name}
                    </span>
                  ))}
                  {finalProviders.filter(p => p.riskScore < 25).length === 0 && (
                    <span className='text-[9px] text-slate-400 italic'>None</span>
                  )}
                </div>
              </div>

            </div>
            <div className='text-center text-[9px] text-slate-400 mt-2'>
              Quadrant plotting shows alert volume vs risk thresholds.
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Provider Leaderboard Metrics charts */}
        <Card className='h-96 flex flex-col justify-between lg:col-span-2'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider'>Leaderboard Risk Rankings</CardTitle>
          </CardHeader>
          <CardContent className='flex-1 flex flex-col justify-between pb-4 pt-1'>
            <div className='flex-1 h-56 mt-2'>
              {comparisonChartData.length === 0 ? (
                <div className='h-full flex items-center justify-center text-xs text-slate-400'>No rankings data available</div>
              ) : (
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={comparisonChartData} margin={{ top: 8, right: 10, left: -24, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray='3 3' opacity={0.3} />
                    <XAxis dataKey='name' tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #cbd5e1',
                        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                        fontSize: 11
                      }}
                    />
                    <Bar dataKey='Risk Score' fill='#f43f5e' radius={[6, 6, 0, 0]} />
                    <Bar dataKey='Claims Value (k$)' fill='#0ea5e9' radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className='text-center text-[9px] text-slate-400 mt-2'>
              Comparative bar metrics plotting Risk Score index vs billing claims totals.
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Side-by-Side Comparison Tool (No-print) */}
      <Card className='no-print'>
        <CardHeader className='pb-3 border-b border-slate-100 dark:border-slate-800/80'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-sm font-semibold'>Comparative Audits Sandbox</CardTitle>
              <p className='text-xs text-slate-450 font-semibold mt-0.5'>Select up to 3 billing providers for side-by-side pattern analysis</p>
            </div>
            {compareList.length > 0 && (
              <button
                type='button'
                onClick={() => setCompareList([])}
                className='text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline'
              >
                Clear Sandbox
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className='pt-4'>
          {/* List selection row */}
          <div className='flex flex-wrap gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-900'>
            {finalProviders.map(p => {
              const active = compareList.includes(p.name)
              return (
                <button
                  key={`compare-btn-${p.name}`}
                  type='button'
                  onClick={() => handleToggleCompare(p.name)}
                  className={cn(
                    'py-1.5 px-3 text-xs font-semibold rounded-xl border transition-all duration-200',
                    active
                      ? 'bg-sky-600 text-white border-transparent shadow-xs'
                      : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350'
                  )}
                >
                  {p.name} {active ? '✓' : '+ Compare'}
                </button>
              )
            })}
          </div>

          {/* Comparative visual grid */}
          {compareList.length === 0 ? (
            <div className='py-8 text-center text-xs text-slate-450 italic'>
              Select provider items above to compare billing indicators.
            </div>
          ) : (
            <div className='grid gap-4 md:grid-cols-3 pt-4 text-xs font-semibold text-slate-700 dark:text-slate-350'>
              {comparisonData.map(p => {
                const riskColor = getRiskColor(p.riskScore)
                return (
                  <div key={`compare-card-${p.name}`} className='p-4 rounded-2xl border border-slate-200/80 bg-slate-50/20 dark:border-slate-800 dark:bg-slate-900/10 space-y-3.5 relative overflow-hidden transition hover:-translate-y-1 hover:shadow-xs'>
                    {/* Glowing side index indicator */}
                    <div className='absolute left-0 top-0 bottom-0 w-1.5' style={{ backgroundColor: riskColor }} />
                    
                    <div className='flex justify-between items-center pl-1'>
                      <span className='font-bold text-slate-900 dark:text-white text-sm'>{p.name}</span>
                      {getRiskBadge(p.riskLevel)}
                    </div>
                    
                    <div className='divide-y divide-slate-100 dark:divide-slate-900 pl-1 text-[11px] space-y-2.5 pt-1.5'>
                      <div className='flex justify-between pb-1 pt-1'>
                        <span className='text-slate-400 font-bold uppercase text-[9px]'>Risk score</span>
                        <span className='font-extrabold text-slate-850 dark:text-white' style={{ color: riskColor }}>{p.riskScore} / 100</span>
                      </div>
                      <div className='flex justify-between pb-1 pt-1.5'>
                        <span className='text-slate-400 font-bold uppercase text-[9px]'>Claims processed</span>
                        <span className='text-slate-950 dark:text-white'>{p.claimsCount}</span>
                      </div>
                      <div className='flex justify-between pb-1 pt-1.5'>
                        <span className='text-slate-400 font-bold uppercase text-[9px]'>Total billing</span>
                        <span className='text-sky-600 dark:text-sky-400'>{formatCurrency(p.totalClaimAmount)}</span>
                      </div>
                      <div className='flex justify-between pb-1 pt-1.5'>
                        <span className='text-slate-400 font-bold uppercase text-[9px]'>Fraud rate</span>
                        <span className='text-rose-500 font-extrabold'>{(p.fraudRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className='flex justify-between pb-1 pt-1.5'>
                        <span className='text-slate-400 font-bold uppercase text-[9px]'>Active alerts</span>
                        <span className='text-amber-500 font-bold'>{p.alertCount}</span>
                      </div>
                      <div className='flex justify-between pt-1.5'>
                        <span className='text-slate-400 font-bold uppercase text-[9px]'>Investigations</span>
                        <span className='text-slate-900 dark:text-slate-205'>{p.investigationCount} cases</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Leaderboard Rankings list (Print area wraps around this) */}
      <div className='print-area'>
        
        {/* Table Leaderboard Queue */}
        <Card className='print-card'>
          <CardHeader className='pb-3 border-b border-slate-100 dark:border-slate-800/80 no-print'>
            <div className='flex flex-wrap items-center justify-between gap-4'>
              <div>
                <CardTitle className='text-sm font-semibold'>Provider Intelligence Leaderboard</CardTitle>
                <p className='text-xs text-slate-450 font-semibold mt-0.5'>Risk rankings listing based on billing indicators and anomaly alerts</p>
              </div>

              {/* Filters */}
              <div className='flex flex-wrap items-center gap-3 w-full lg:w-auto'>
                <div className='relative w-full sm:w-60'>
                  <Search className='absolute top-2.5 left-3 h-4 w-4 text-slate-400' />
                  <input
                    type='text'
                    placeholder='Search Provider Name...'
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    className='h-9 w-full rounded-xl border border-slate-200 bg-slate-55 pl-9 pr-3 text-xs text-slate-800 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
                  />
                </div>

                <select
                  value={filterRiskLevel}
                  onChange={(e) => { setFilterRiskLevel(e.target.value); setCurrentPage(1); }}
                  className='h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350'
                >
                  <option value='All'>All Risk Levels</option>
                  <option value='Critical'>Critical Only</option>
                  <option value='High'>High Only</option>
                  <option value='Medium'>Medium Only</option>
                  <option value='Low'>Low Only</option>
                </select>

                <select
                  value={filterWatchlist}
                  onChange={(e) => { setFilterWatchlist(e.target.value); setCurrentPage(1); }}
                  className='h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350'
                >
                  <option value='All'>All Monitoring</option>
                  <option value='Watchlist Only'>Watchlist Only</option>
                </select>

                {(search || filterRiskLevel !== 'All' || filterWatchlist !== 'All') && (
                  <button
                    type='button'
                    onClick={handleResetFilters}
                    className='text-xs font-bold text-sky-655 hover:text-sky-700 dark:text-sky-400'
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className='pt-4 overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead>
                <tr className='border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:border-slate-800/40 dark:text-slate-500'>
                  <th className='py-3'>Provider</th>
                  <th className='py-3 text-right cursor-pointer hover:text-slate-600 dark:hover:text-slate-300' onClick={() => handleRequestSort('claimsCount')}>
                    Claims Volume <span className='text-[9px]'>{sortField === 'claimsCount' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className='py-3 text-right cursor-pointer hover:text-slate-650 dark:hover:text-slate-300' onClick={() => handleRequestSort('totalClaimAmount')}>
                    Total Value <span className='text-[9px]'>{sortField === 'totalClaimAmount' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className='py-3 text-right cursor-pointer hover:text-slate-650 dark:hover:text-slate-300' onClick={() => handleRequestSort('fraudCount')}>
                    Fraud Cases <span className='text-[9px]'>{sortField === 'fraudCount' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className='py-3 text-right cursor-pointer hover:text-slate-650 dark:hover:text-slate-300' onClick={() => handleRequestSort('investigationCount')}>
                    Investigations <span className='text-[9px]'>{sortField === 'investigationCount' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className='py-3 text-right cursor-pointer hover:text-slate-650 dark:hover:text-slate-300' onClick={() => handleRequestSort('riskScore')}>
                    Risk score <span className='text-[9px]'>{sortField === 'riskScore' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className='py-3 text-center'>Risk Level</th>
                  <th className='py-3 text-center no-print'>Watchlist</th>
                  <th className='py-3 no-print'>Custom Flag</th>
                  <th className='py-3 text-center no-print'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100 dark:divide-slate-900'>
                {sortedProviders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className='py-12'>
                      <EmptyState
                        title='No Providers Found'
                        description='No billing provider matches your leaderboard filters.'
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
                  paginatedProviders.map((p) => (
                    <tr
                      key={p.name}
                      className={cn(
                        'hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors cursor-pointer',
                        selectedProvider?.name === p.name ? 'bg-sky-50/20 dark:bg-sky-950/10 font-semibold' : ''
                      )}
                      onClick={() => setSelectedProvider(p)}
                    >
                      <td className='py-3.5 font-extrabold text-slate-900 dark:text-white flex items-center gap-2'>
                        <Hospital className='h-4 w-4 shrink-0 text-slate-400' />
                        {p.name}
                      </td>
                      <td className='py-3.5 text-right font-medium text-slate-700 dark:text-slate-300'>{p.claimsCount} claims</td>
                      <td className='py-3.5 text-right font-medium text-sky-600 dark:text-sky-405'>{formatCurrency(p.totalClaimAmount)}</td>
                      <td className='py-3.5 text-right font-bold text-rose-500'>{p.fraudCount}</td>
                      <td className='py-3.5 text-right text-slate-700 dark:text-slate-300 font-semibold'>{p.investigationCount} cases</td>
                      <td className='py-3.5 text-right font-extrabold text-slate-900 dark:text-white'>{p.riskScore}</td>
                      <td className='py-3.5 text-center'>{getRiskBadge(p.riskLevel)}</td>
                      <td className='py-3.5 text-center no-print' onClick={(e) => e.stopPropagation()}>
                        <button
                          type='button'
                          onClick={() => toggleWatchlist(p.name)}
                          className={cn('text-xs transition', p.watchlist ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400')}
                        >
                          <Star className={cn('h-4.5 w-4.5', p.watchlist ? 'fill-amber-550' : '')} />
                        </button>
                      </td>
                      <td className='py-3.5 text-slate-500 max-w-[140px] truncate no-print font-medium'>{p.flag || '-'}</td>
                      <td className='py-3.5 text-center no-print' onClick={(e) => e.stopPropagation()}>
                        <button
                          type='button'
                          onClick={() => setSelectedProvider(p)}
                          className='inline-flex items-center gap-0.5 text-[11px] font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline'
                        >
                          Audit Profile <ChevronRight className='h-3 w-3' />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination Segment */}
            {sortedProviders.length > 0 && (
              <div className='flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-slate-800/80 dark:text-slate-405 mt-2 no-print'>
                <div>
                  Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedProviders.length)} of {sortedProviders.length} providers
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
          </CardContent>
        </Card>
      </div>

      {/* Slide-over Profile Drawer (No-print) */}
      <AnimatePresence>
        {selectedProvider && (
          <ProviderDrawer
            providerItem={activeProviderInDrawer}
            onClose={() => setSelectedProvider(null)}
            watchlistActive={selectedProvider.watchlist}
            onToggleWatchlist={toggleWatchlist}
            flagText={selectedProvider.flag}
            onSaveFlag={setProviderFlag}
          />
        )}
      </AnimatePresence>

    </section>
  )
}
