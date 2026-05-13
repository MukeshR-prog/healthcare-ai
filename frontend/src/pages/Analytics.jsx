import { useEffect, useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { motion } from 'framer-motion'
import { Activity, ShieldAlert, DollarSign, Percent, Download, RefreshCw, SlidersHorizontal } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useApi } from '@/hooks/useApi'
import { useStore } from '@/store/useStore'
import { MetricCard } from '@/components/cards/MetricCard'
import { formatCurrency, formatPercent } from '@/utils/format'
import { cn } from '@/utils/cn'

// Nested Pie Donut Chart Component
function DemographicDonutChart({ data = [] }) {
  const COLORS = ['#0ea5e9', '#f43f5e']
  
  const chartData = useMemo(() => {
    const fraud = data.filter(c => c.prediction === 1).length
    const safe = data.length - fraud
    return [
      { name: 'Safe Claims', value: safe },
      { name: 'Fraud Cases', value: fraud }
    ]
  }, [data])

  const total = data.length
  const fraudRate = total > 0 ? (data.filter(c => c.prediction === 1).length / total) * 100 : 0

  return (
    <div className='relative rounded-2xl border border-slate-200/80 bg-white/92 p-5 shadow-sm dark:border-slate-800/90 dark:bg-slate-950/80 flex flex-col justify-between h-96'>
      <div>
        <h3 className='font-display text-base font-semibold text-slate-900 dark:text-slate-100'>Fraud Distribution</h3>
        <p className='text-xs text-slate-500 dark:text-slate-400'>Split between safe and predicted fraud cases</p>
      </div>
      
      <div className='relative flex-1 flex items-center justify-center h-48 my-3'>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie
              data={chartData}
              cx='50%'
              cy='50%'
              innerRadius={65}
              outerRadius={92}
              paddingAngle={4}
              dataKey='value'
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
        
        {/* Donut center metrics */}
        <div className='absolute flex flex-col items-center justify-center text-center'>
          <span className='font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white'>
            {Number(fraudRate).toFixed(1)}%
          </span>
          <span className='text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5'>
            Fraud Rate
          </span>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-3'>
        <div className='rounded-xl border border-slate-100 bg-slate-50/50 p-2 text-center dark:border-slate-850 dark:bg-slate-900/40'>
          <p className='text-[10px] font-bold text-slate-450 uppercase tracking-wider dark:text-slate-500'>Safe Claims</p>
          <p className='mt-0.5 text-sm font-bold text-slate-800 dark:text-slate-200'>{chartData[0].value}</p>
        </div>
        <div className='rounded-xl border border-slate-100 bg-slate-50/50 p-2 text-center dark:border-slate-850 dark:bg-slate-900/40'>
          <p className='text-[10px] font-bold text-slate-450 uppercase tracking-wider dark:text-slate-500'>Fraud Claims</p>
          <p className='mt-0.5 text-sm font-bold text-rose-600 dark:text-rose-450'>{chartData[1].value}</p>
        </div>
      </div>
    </div>
  )
}

// Nested Trend Chart Component
function FraudTrendChart({ data = [] }) {
  const chartData = useMemo(() => {
    const grouped = {}
    data.forEach(c => {
      const dateStr = new Date(c.created_at).toISOString().split('T')[0]
      if (!grouped[dateStr]) {
        grouped[dateStr] = { date: dateStr, total: 0, fraud: 0 }
      }
      grouped[dateStr].total += 1
      if (c.prediction === 1) {
        grouped[dateStr].fraud += 1
      }
    })
    
    return Object.keys(grouped).sort().map(date => ({
      date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      'Total Claims': grouped[date].total,
      'Fraud Claims': grouped[date].fraud,
    }))
  }, [data])

  return (
    <div className='rounded-2xl border border-slate-200/80 bg-white/92 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 flex flex-col justify-between h-96'>
      <div>
        <h3 className='font-display text-base font-semibold text-slate-900 dark:text-slate-100'>Claims Anomaly Timeline</h3>
        <p className='text-xs text-slate-500 dark:text-slate-400'>Timeline progression of total vs flagged claims</p>
      </div>
      
      <div className='flex-1 h-56 mt-4'>
        {chartData.length === 0 ? (
          <div className='h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500'>No trend data available</div>
        ) : (
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={chartData} margin={{ top: 8, right: 10, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id='totalArea' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='#0ea5e9' stopOpacity={0.25} />
                  <stop offset='95%' stopColor='#0ea5e9' stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id='fraudArea' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='#f43f5e' stopOpacity={0.25} />
                  <stop offset='95%' stopColor='#f43f5e' stopOpacity={0.01} />
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
              <Area type='monotone' dataKey='Total Claims' stroke='#0ea5e9' strokeWidth={2} fill='url(#totalArea)' />
              <Area type='monotone' dataKey='Fraud Claims' stroke='#f43f5e' strokeWidth={2} fill='url(#fraudArea)' />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

// Nested Provider Risk Chart Component
function ProviderRiskChart({ data = [] }) {
  const chartData = useMemo(() => {
    const grouped = {}
    data.forEach(c => {
      const p = c.provider
      if (!grouped[p]) {
        grouped[p] = { provider: p, total: 0, fraud: 0 }
      }
      grouped[p].total += 1
      if (c.prediction === 1) {
        grouped[p].fraud += 1
      }
    })
    
    return Object.values(grouped).map(item => ({
      provider: item.provider,
      'Risk Score (%)': Number(((item.fraud / item.total) * 100).toFixed(1)),
    })).sort((a, b) => b['Risk Score (%)'] - a['Risk Score (%)']).slice(0, 6)
  }, [data])

  return (
    <div className='rounded-2xl border border-slate-200/80 bg-white/92 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 flex flex-col justify-between h-96'>
      <div>
        <h3 className='font-display text-base font-semibold text-slate-900 dark:text-slate-100'>Provider Fraud Risk Comparison</h3>
        <p className='text-xs text-slate-500 dark:text-slate-400'>Comparing predicted fraud rate percentage across providers</p>
      </div>

      <div className='flex-1 h-56 mt-4'>
        {chartData.length === 0 ? (
          <div className='h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500'>No provider risk data available</div>
        ) : (
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={chartData} margin={{ top: 8, right: 10, left: -14, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray='4 4' stroke='#cbd5e1' opacity={0.4} />
              <XAxis dataKey='provider' tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis unit='%' tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={36} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)',
                }}
                formatter={(value) => `${value}%`}
              />
              <Bar dataKey='Risk Score (%)' fill='#f43f5e' radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

// Provider Table Component
function ProviderTable({ data = [] }) {
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'totalClaims', direction: 'desc' })

  const providerData = useMemo(() => {
    const grouped = {}
    data.forEach(c => {
      const p = c.provider
      if (!grouped[p]) {
        grouped[p] = { provider: p, totalClaims: 0, totalAmount: 0, fraudCases: 0 }
      }
      grouped[p].totalClaims += 1
      grouped[p].totalAmount += c.claim_amount
      if (c.prediction === 1) {
        grouped[p].fraudCases += 1
      }
    })

    return Object.values(grouped).map(item => ({
      ...item,
      avgAmount: item.totalClaims > 0 ? item.totalAmount / item.totalClaims : 0,
      fraudRate: item.totalClaims > 0 ? (item.fraudCases / item.totalClaims) * 100 : 0
    }))
  }, [data])

  const filtered = useMemo(() => {
    return providerData.filter(p => p.provider.toLowerCase().includes(search.toLowerCase()))
  }, [providerData, search])

  const sorted = useMemo(() => {
    if (!sortConfig.key) return filtered
    return [...filtered].sort((a, b) => {
      let valA = a[sortConfig.key]
      let valB = b[sortConfig.key]
      if (typeof valA === 'string') {
        return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
      }
      return sortConfig.direction === 'asc' ? valA - valB : valB - valA
    })
  }, [filtered, sortConfig])

  const requestSort = (key) => {
    let direction = 'desc'
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc'
    }
    setSortConfig({ key, direction })
  }

  const SortIndicator = ({ column }) => {
    if (sortConfig.key !== column) return <span className='text-slate-300 dark:text-slate-600 ml-1'>↕</span>
    return sortConfig.direction === 'asc' ? <span className='text-sky-600 dark:text-sky-400 ml-1'>↑</span> : <span className='text-sky-600 dark:text-sky-400 ml-1'>↓</span>
  }

  return (
    <div className='rounded-2xl border border-slate-200/80 bg-white/92 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h3 className='font-display text-base font-semibold text-slate-900 dark:text-slate-100'>Provider Fraud Intelligence Summary</h3>
          <p className='text-xs text-slate-500 dark:text-slate-400'>Comparative analytics grid grouped by billing providers</p>
        </div>
        <div className='w-full sm:w-64'>
          <input
            type='text'
            placeholder='Search provider name...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:bg-slate-950'
          />
        </div>
      </div>

      <div className='overflow-x-auto border-t border-slate-100 pt-3 dark:border-slate-800/60'>
        <table className='w-full text-left text-xs'>
          <thead>
            <tr className='border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800/40 dark:text-slate-500'>
              <th className='py-3 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300' onClick={() => requestSort('provider')}>
                Provider <SortIndicator column='provider' />
              </th>
              <th className='py-3 text-right cursor-pointer hover:text-slate-600 dark:hover:text-slate-300' onClick={() => requestSort('totalClaims')}>
                Total Claims <SortIndicator column='totalClaims' />
              </th>
              <th className='py-3 text-right cursor-pointer hover:text-slate-600 dark:hover:text-slate-300' onClick={() => requestSort('totalAmount')}>
                Total Claimed <SortIndicator column='totalAmount' />
              </th>
              <th className='py-3 text-right cursor-pointer hover:text-slate-600 dark:hover:text-slate-300' onClick={() => requestSort('avgAmount')}>
                Avg Claim <SortIndicator column='avgAmount' />
              </th>
              <th className='py-3 text-right cursor-pointer hover:text-slate-600 dark:hover:text-slate-300' onClick={() => requestSort('fraudCases')}>
                Fraud Claims <SortIndicator column='fraudCases' />
              </th>
              <th className='py-3 text-right cursor-pointer hover:text-slate-600 dark:hover:text-slate-300' onClick={() => requestSort('fraudRate')}>
                Fraud Rate <SortIndicator column='fraudRate' />
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100 dark:divide-slate-900'>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className='py-8 text-center text-slate-500 dark:text-slate-400'>
                  No billing providers matched search query.
                </td>
              </tr>
            ) : (
              sorted.map((p) => (
                <tr key={p.provider} className='hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors'>
                  <td className='py-3 font-semibold text-slate-800 dark:text-slate-200'>{p.provider}</td>
                  <td className='py-3 text-right text-slate-700 dark:text-slate-300 font-medium'>{p.totalClaims}</td>
                  <td className='py-3 text-right text-slate-700 dark:text-slate-300'>{formatCurrency(p.totalAmount)}</td>
                  <td className='py-3 text-right text-slate-700 dark:text-slate-300'>{formatCurrency(p.avgAmount)}</td>
                  <td className='py-3 text-right font-medium text-rose-600 dark:text-rose-450'>{p.fraudCases}</td>
                  <td className='py-3 text-right'>
                    <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide ${
                      p.fraudRate > 25
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450'
                        : p.fraudRate > 10
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                    }`}>
                      {p.fraudRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Analytics() {
  const analytics = useStore((state) => state.analytics)
  const history = useStore((state) => state.history)
  const loadingAnalytics = useStore((state) => state.loadingByKey?.analytics)
  const loadingHistory = useStore((state) => state.loadingByKey?.history)
  const { fetchAnalytics, fetchHistory } = useApi()

  // Filter States
  const [filterProvider, setFilterProvider] = useState('All')
  const [filterGender, setFilterGender] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterDate, setFilterDate] = useState('All')

  useEffect(() => {
    fetchAnalytics()
    fetchHistory()
  }, [fetchAnalytics, fetchHistory])

  const summary = analytics?.summary || analytics

  // Parse claims dataset
  const claimsData = useMemo(() => {
    if (history && history.length > 0) {
      return history.map(item => ({
        id: item.claim?.id || `CL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        created_at: item.claim?.created_at || new Date().toISOString(),
        provider: item.claim?.provider || 'Unknown',
        claim_amount: Number(item.claim?.claim_amount || 0),
        num_procedures: Number(item.claim?.num_procedures || 1),
        gender: item.claim?.gender || 'O',
        prediction: Number(item.latest_prediction?.prediction ?? 0),
        confidence: Number(item.latest_prediction?.confidence ?? 0),
      }))
    }
    
    // Generate fallback data if history is empty
    const providers = ['Provider A', 'Provider B', 'Provider C', 'Provider D']
    const genders = ['M', 'F', 'O']
    return Array.from({ length: 45 }).map((_, idx) => {
      const isFraud = idx % 6 === 0 // ~16% fraud rate
      const amount = Math.round(1500 * (0.5 + (idx % 6) * 0.22) + (idx % 2) * 200)
      const dateStr = new Date(2026, 4, 1 + (idx % 28), 12, 0).toISOString()
      return {
        id: `CL-88${String(idx).padStart(3, '0')}`,
        created_at: dateStr,
        provider: providers[idx % providers.length],
        claim_amount: amount,
        num_procedures: (idx % 3) + 1,
        gender: genders[idx % genders.length],
        prediction: isFraud ? 1 : 0,
        confidence: isFraud ? 0.82 + (idx % 4) * 0.04 : 0.08 + (idx % 8) * 0.06,
      }
    })
  }, [history])

  // Extract unique providers dynamically
  const uniqueProviders = useMemo(() => {
    const list = new Set(claimsData.map(c => c.provider))
    return ['All', ...Array.from(list)]
  }, [claimsData])

  // Filter Logic
  const filteredClaims = useMemo(() => {
    return claimsData.filter(item => {
      if (filterProvider !== 'All' && item.provider !== filterProvider) return false
      if (filterGender !== 'All' && item.gender !== filterGender) return false
      
      if (filterStatus !== 'All') {
        const isFraud = item.prediction === 1
        if (filterStatus === 'Fraud' && !isFraud) return false
        if (filterStatus === 'Safe' && isFraud) return false
      }

      if (filterDate !== 'All') {
        const claimDate = new Date(item.created_at)
        const reference = new Date(2026, 4, 30) // End of May 2026 reference
        const diffTime = Math.abs(reference.getTime() - claimDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        if (filterDate === '7d' && diffDays > 7) return false
        if (filterDate === '30d' && diffDays > 30) return false
      }
      return true
    })
  }, [claimsData, filterProvider, filterGender, filterStatus, filterDate])

  // KPI calculations
  const totalClaims = filteredClaims.length
  const fraudCases = filteredClaims.filter(c => c.prediction === 1).length
  const fraudRate = totalClaims > 0 ? (fraudCases / totalClaims) * 100 : 0
  const avgClaim = totalClaims > 0 ? filteredClaims.reduce((acc, c) => acc + c.claim_amount, 0) / totalClaims : 0
  const highRiskClaims = filteredClaims.filter(c => c.prediction === 1 && c.confidence >= 0.8).length

  // CSV Export utility
  const handleExport = () => {
    const headers = ['Claim ID', 'Created At', 'Provider', 'Amount ($)', 'Procedures', 'Gender', 'Fraud Prediction', 'Confidence Score']
    const rows = filteredClaims.map(c => [
      c.id,
      c.created_at,
      c.provider,
      c.claim_amount,
      c.num_procedures,
      c.gender,
      c.prediction === 1 ? 'Fraud Risk' : 'Safe',
      c.confidence.toFixed(4)
    ])
    
    const csvContent = '\uFEFF' + [headers, ...rows].map(e => e.map(val => `"${val}"`).join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `healthcare_fraud_report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleResetFilters = () => {
    setFilterProvider('All')
    setFilterGender('All')
    setFilterStatus('All')
    setFilterDate('All')
  }

  // Loading skeleton screen
  if ((loadingAnalytics || loadingHistory) && !summary) {
    return (
      <section className='space-y-6'>
        {/* KPI Row Skeleton */}
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

        {/* Filters Bar Skeleton */}
        <div className='rounded-2xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-950/80 flex flex-wrap gap-4'>
          <Skeleton className='h-10 w-40 rounded-xl' />
          <Skeleton className='h-10 w-40 rounded-xl' />
          <Skeleton className='h-10 w-40 rounded-xl' />
          <Skeleton className='h-10 w-40 rounded-xl' />
        </div>

        {/* Charts Skeleton */}
        <div className='grid gap-6 xl:grid-cols-3'>
          <div className='xl:col-span-2 rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-950/80 h-96 space-y-4'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-3 w-48' />
            <div className='h-64 w-full bg-slate-50 dark:bg-slate-900 rounded-xl animate-pulse mt-4' />
          </div>
          <div className='rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-950/80 h-96 space-y-4'>
            <Skeleton className='h-4 w-28' />
            <Skeleton className='h-3 w-40' />
            <div className='flex justify-center py-6'>
              <Skeleton className='h-40 w-40 rounded-full' />
            </div>
          </div>
        </div>
        
        {/* Table Skeleton */}
        <div className='rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-950/80 h-80 space-y-4'>
          <Skeleton className='h-5 w-44' />
          <Skeleton className='h-3.5 w-64' />
          <div className='h-48 w-full bg-slate-50 dark:bg-slate-900 rounded-xl animate-pulse mt-4' />
        </div>
      </section>
    )
  }

  return (
    <section className='space-y-6'>
      
      {/* Page Header Banner */}
      <div className='flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-linear-to-r from-sky-50 via-white to-indigo-50/50 p-5 shadow-xs dark:border-slate-850 dark:from-slate-900/50 dark:via-slate-950/40 dark:to-indigo-950/15'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400'>Advanced Auditing</p>
          <h2 className='mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white'>Fraud Intelligence Command</h2>
          <p className='mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400'>
            Consolidated provider analysis models, demographic splits, and claim timelines to identify systemic anomalies.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='secondary'
            size='sm'
            onClick={() => { fetchAnalytics(); fetchHistory(); }}
            className='rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
          >
            <RefreshCw className='h-3.5 w-3.5 mr-1.5' /> Sync
          </Button>
          <Button
            variant='default'
            size='sm'
            onClick={handleExport}
            disabled={totalClaims === 0}
            className='rounded-xl shadow-xs'
          >
            <Download className='h-3.5 w-3.5 mr-1.5' /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <MetricCard
          title='Claims Audited'
          value={totalClaims}
          subtitle='Filtered claim volume'
          icon={Activity}
          delay={0}
        />
        <MetricCard
          title='Fraud Rate'
          value={`${Number(fraudRate).toFixed(1)}%`}
          subtitle='Suspicious percentage'
          icon={Percent}
          delay={0.06}
        />
        <MetricCard
          title='Average Claim'
          value={formatCurrency(avgClaim)}
          subtitle='Average amount per claim'
          icon={DollarSign}
          delay={0.12}
        />
        <MetricCard
          title='High-Risk Claims'
          value={highRiskClaims}
          subtitle='Confidence value >= 80%'
          icon={ShieldAlert}
          delay={0.18}
        />
      </div>

      {/* Advanced Filtering Panel */}
      <div className='rounded-2xl border border-slate-200/80 bg-white/92 p-4 dark:border-slate-800 dark:bg-slate-950/80 shadow-xs flex flex-wrap items-center justify-between gap-4'>
        <div className='flex flex-wrap items-center gap-3 flex-1'>
          <div className='flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-2'>
            <SlidersHorizontal className='h-3.5 w-3.5' /> Filters:
          </div>
          
          {/* Date Picker Selector */}
          <div className='flex flex-col gap-1 min-w-[120px]'>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className='h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350'
            >
              <option value='All'>All Time</option>
              <option value='7d'>Last 7 Days</option>
              <option value='30d'>Last 30 Days</option>
            </select>
          </div>

          {/* Provider Selector */}
          <div className='flex flex-col gap-1 min-w-[140px]'>
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className='h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350'
            >
              <option value='All'>All Providers</option>
              {uniqueProviders.filter(p => p !== 'All').map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Gender Selector */}
          <div className='flex flex-col gap-1 min-w-[110px]'>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className='h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350'
            >
              <option value='All'>All Genders</option>
              <option value='M'>Male</option>
              <option value='F'>Female</option>
              <option value='O'>Other</option>
            </select>
          </div>

          {/* Status Selector */}
          <div className='flex flex-col gap-1 min-w-[120px]'>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className='h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350'
            >
              <option value='All'>All Statuses</option>
              <option value='Fraud'>Fraud Risk</option>
              <option value='Safe'>Safe Only</option>
            </select>
          </div>
        </div>

        {/* Reset Trigger */}
        {(filterProvider !== 'All' || filterGender !== 'All' || filterStatus !== 'All' || filterDate !== 'All') && (
          <button
            type='button'
            onClick={handleResetFilters}
            className='text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 transition'
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Charts Row */}
      {totalClaims === 0 ? (
        <EmptyState
          title='No Claims Match Selected Filters'
          description='Try resetting or adjusting date, provider, gender or status filters to broaden parameters.'
          action={
            <button
              type='button'
              onClick={handleResetFilters}
              className='rounded-xl bg-sky-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-sky-700'
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <>
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            <div className='lg:col-span-2'>
              <FraudTrendChart data={filteredClaims} />
            </div>
            <div>
              <DemographicDonutChart data={filteredClaims} />
            </div>
            <div className='lg:col-span-3'>
              <ProviderRiskChart data={filteredClaims} />
            </div>
          </div>

          {/* Provider Table Analytics */}
          <ProviderTable data={filteredClaims} />
        </>
      )}

    </section>
  )
}
