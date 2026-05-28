import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts'
import {
  FileText,
  Plus,
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
  Clock,
  Briefcase,
  Layers,
  ArrowRight,
  Check,
  Eye,
  Info,
  DollarSign,
  TrendingUp,
  Save,
  Trash2,
  Copy,
  FileBarChart,
  ClipboardList,
  Mail,
  Sliders
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useApi } from '@/hooks/useApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import toast from 'react-hot-toast'
import { cn } from '@/utils/cn'

// Inline currency & percent formatters
const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
const formatPercent = (val) =>
  new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(val)

const getRiskColor = (score) => {
  if (score >= 75) return '#f43f5e' // Rose
  if (score >= 50) return '#f97316' // Orange
  if (score >= 25) return '#eab308' // Amber
  return '#10b981' // Emerald
}

export default function Reports() {
  const alerts = useStore((state) => state.alerts || [])
  const cases = useStore((state) => state.cases || [])
  const documents = useStore((state) => state.documents || [])
  const history = useStore((state) => state.history || [])
  const providerWatchlist = useStore((state) => state.providerWatchlist || [])
  const providerFlags = useStore((state) => state.providerFlags || {})
  
  const reports = useStore((state) => state.reports || [])
  const reportTemplates = useStore((state) => state.reportTemplates || [])
  const auditLogs = useStore((state) => state.auditLogs || [])
  
  const createReport = useStore((state) => state.createReport)
  const deleteReport = useStore((state) => state.deleteReport)
  const duplicateReport = useStore((state) => state.duplicateReport)
  const saveTemplate = useStore((state) => state.saveTemplate)
  const createAuditLog = useStore((state) => state.createAuditLog)
  
  const loading = useStore((state) => state.loadingByKey?.history)
  const { fetchHistory } = useApi()

  // State Variables
  const [selectedReportId, setSelectedReportId] = useState(null)
  const [reportTitle, setReportTitle] = useState('')
  const [reportType, setReportType] = useState('Executive Summary')
  const [timeRange, setTimeRange] = useState('Last 30 Days')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('All')
  
  // Scheduled report config states
  const [schedulePref, setSchedulePref] = useState('Weekly')
  const [scheduleEmail, setScheduleEmail] = useState('auditors@platform.com')
  const [scheduleActive, setScheduleActive] = useState(false)

  // Fetch data on mount
  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Initialize preset templates & mock audit logs if empty
  useEffect(() => {
    if (reportTemplates.length === 0) {
      const presets = [
        { id: 'tpl-1', title: 'Monthly Fraud Report', type: 'Fraud Loss Summary', timeRange: 'Last 30 Days', desc: 'Focuses on billing spikes, anomaly prediction rates, and claim volume distribution.' },
        { id: 'tpl-2', title: 'Executive Summary Brief', type: 'Executive Summary', timeRange: 'Last 30 Days', desc: 'Overview brief of loss estimates, open cases, and investigation closure metrics.' },
        { id: 'tpl-3', title: 'Compliance Audit Dossier', type: 'Compliance Document Audit', timeRange: 'Last 90 Days', desc: 'OCR verification mismatch ratios, coverage counts, and readiness checklist.' },
        { id: 'tpl-4', title: 'Provider Risk Rankings', type: 'Provider Risk Review', timeRange: 'Last 30 Days', desc: 'High-risk provider profiling, watchlist status updates, and Flag annotations.' }
      ]
      presets.forEach(p => saveTemplate(p))
    }

    if (auditLogs.length === 0) {
      const initialLogs = [
        { id: `aud-1`, action: 'Case Escalated', details: 'Alert AL-9901 escalated into Case CASE-9901.', date: new Date(Date.now() - 3600000 * 2).toISOString(), analyst: 'Analyst Sarah' },
        { id: `aud-2`, action: 'Document Rejected', details: 'OCR verification mismatch on DOC-201 (double-billing).', date: new Date(Date.now() - 3600000 * 6).toISOString(), analyst: 'System Engine' },
        { id: `aud-3`, action: 'Watchlist Status Updated', details: 'Provider B flag recorded: "Suspected upcoding".', date: new Date(Date.now() - 3600000 * 12).toISOString(), analyst: 'Analyst Dave' },
        { id: `aud-4`, action: 'Report Compiled', details: 'Executive Summary compiled successfully.', date: new Date(Date.now() - 3600000 * 24).toISOString(), analyst: 'Analyst Sarah' }
      ]
      initialLogs.forEach(log => createAuditLog(log))
    }
  }, [reportTemplates, auditLogs, saveTemplate, createAuditLog])

  // Initial mock reports if empty
  useEffect(() => {
    if (reports.length === 0 && history.length === 0) {
      const mockReports = [
        {
          id: 'REP-101',
          title: 'May 2026 Executive Fraud Summary',
          type: 'Executive Summary',
          timeRange: 'Last 30 Days',
          date: new Date(2026, 4, 25).toISOString(),
          creator: 'Analyst Sarah',
          summary: 'Aggregate assessment of active fraud claims, open cases, and OCR clinical audits. High-risk groupings continue to cluster around Provider B.',
          metrics: {
            lossEstimate: 536050,
            openCases: 3,
            flaggedClaims: 8,
            mismatchDocs: 2,
            readiness: 88
          },
          chartsData: [
            { name: 'Provider B', value: 82 },
            { name: 'Provider C', value: 68 },
            { name: 'Provider A', value: 24 },
            { name: 'Provider D', value: 18 }
          ],
          tableData: [
            { field: 'Fraud Loss Estimate', val: '$536,050' },
            { field: 'Open Cases Count', val: '3 cases' },
            { field: 'Verification Coverage', val: '75.2%' },
            { field: 'Audit Readiness Score', val: '88%' }
          ]
        }
      ]
      mockReports.forEach(r => createReport(r))
    }
  }, [reports, history.length, createReport])

  // Calculate live database figures
  const liveStats = useMemo(() => {
    // Loss Estimate
    let lossEstimate = 0
    let highRiskCount = 0
    let mappedClaims = 0

    history.forEach((h) => {
      const amount = Number(h.claim?.claim_amount || 0)
      const isFraud = h.latest_prediction?.prediction === 1
      const conf = h.latest_prediction?.confidence || 0

      mappedClaims++
      if (isFraud) {
        lossEstimate += amount
      }
      if (conf >= 0.70) {
        highRiskCount++
      }
    })

    // Fallbacks if history empty
    if (mappedClaims === 0) {
      lossEstimate = 536050
      highRiskCount = 3
      mappedClaims = 18
    }

    // Open Cases
    const openCases = cases.filter((c) => c.status !== 'Closed').length

    // Mismatch document verifications
    const mismatchDocs = documents.filter((d) => d.status === 'Mismatch').length

    // Verification Coverage ratio
    const verifiedDocs = documents.filter((d) => d.status === 'Verified').length
    const totalDocs = documents.length || 4
    const docCoverage = totalDocs > 0 ? verifiedDocs / totalDocs : 0.72

    // Investigation Completion Rate
    const closedCases = cases.filter((c) => c.status === 'Closed').length
    const totalCases = cases.length || 3
    const completionRate = totalCases > 0 ? closedCases / totalCases : 0.66

    // Audit Readiness Score
    const pendingAlerts = alerts.filter((a) => a.status === 'New').length
    const alertScore = Math.max(100 - pendingAlerts * 8, 40)
    const mismatchPenalties = mismatchDocs * 10
    const readinessScore = Math.round(Math.max(alertScore - mismatchPenalties, 50))

    return {
      lossEstimate,
      openCases,
      highRiskCount,
      mismatchDocs,
      docCoverage,
      completionRate,
      readinessScore,
      mappedClaims
    }
  }, [history, cases, documents, alerts])

  // Generate Report Action handler
  const handleGenerateReport = (e) => {
    if (e) e.preventDefault()
    if (!reportTitle.trim()) {
      toast.error('Please specify a report title!')
      return
    }

    // Compiling dynamic data based on selected Report Type
    let summary = ''
    let metrics = {}
    let tableData = []
    let chartsData = []

    if (reportType === 'Executive Summary') {
      summary = `Platform overview covering estimated fraud exposure, verification coverage ratios, and compliance audits for ${timeRange}. Analytics point toward localized upcoding anomalies.`
      metrics = {
        lossEstimate: liveStats.lossEstimate,
        openCases: liveStats.openCases,
        flaggedClaims: liveStats.highRiskCount,
        mismatchDocs: liveStats.mismatchDocs,
        readiness: liveStats.readinessScore
      }
      tableData = [
        { field: 'Loss exposure exposure', val: formatCurrency(liveStats.lossEstimate) },
        { field: 'Active open cases', val: `${liveStats.openCases} cases` },
        { field: 'OCR verification coverage', val: formatPercent(liveStats.docCoverage) },
        { field: 'Audit readiness compliance', val: `${liveStats.readinessScore}%` }
      ]
      chartsData = [
        { name: 'Fraud Loss', value: liveStats.lossEstimate / 1000 },
        { name: 'Verified Claims', value: (liveStats.mappedClaims - liveStats.highRiskCount) * 10 }
      ]
    } else if (reportType === 'Provider Risk Review') {
      summary = `Dynamic profiling of high-risk billing entities. Aggregates fraud rates, upcoding code clusters, and watchlist flagging annotations.`
      metrics = {
        lossEstimate: liveStats.lossEstimate * 0.7,
        openCases: liveStats.openCases,
        flaggedClaims: liveStats.highRiskCount,
        mismatchDocs: liveStats.mismatchDocs,
        readiness: liveStats.readinessScore
      }
      tableData = [
        { field: 'Critical providers volume', val: '2 providers' },
        { field: 'Flagged claims share', val: formatCurrency(liveStats.lossEstimate) },
        { field: 'Watchlist additions count', val: `${providerWatchlist.length} billing entities` }
      ]
      chartsData = [
        { name: 'Provider B', value: 82 },
        { name: 'Provider C', value: 68 },
        { name: 'Provider A', value: 24 },
        { name: 'Provider D', value: 18 }
      ]
    } else {
      // General fallbacks
      summary = `${reportType} compiled dynamically. Evaluates anomaly spikes, verification timelines, and operational workflow backlogs.`
      metrics = {
        lossEstimate: liveStats.lossEstimate,
        openCases: liveStats.openCases,
        flaggedClaims: liveStats.highRiskCount,
        mismatchDocs: liveStats.mismatchDocs,
        readiness: liveStats.readinessScore
      }
      tableData = [
        { field: 'Exposure Estimate', val: formatCurrency(liveStats.lossEstimate) },
        { field: 'Open cases log', val: `${liveStats.openCases} cases` },
        { field: 'Document checks', val: `${documents.length} forms` }
      ]
      chartsData = [
        { name: 'Open cases', value: liveStats.openCases },
        { name: 'Alerts queue', value: alerts.length || 5 },
        { name: 'Mismatch files', value: liveStats.mismatchDocs }
      ]
    }

    const newReport = {
      id: `REP-${Date.now()}`,
      title: reportTitle.trim(),
      type: reportType,
      timeRange,
      date: new Date().toISOString(),
      creator: 'Analyst Sarah',
      summary,
      metrics,
      tableData,
      chartsData
    }

    createReport(newReport)
    setSelectedReportId(newReport.id)
    setReportTitle('')

    // Append to audit activity logs
    createAuditLog({
      id: `aud-${Date.now()}`,
      action: 'Report Compiled',
      details: `Generated new "${newReport.title}" (${newReport.type}) report.`,
      date: new Date().toISOString(),
      analyst: 'Analyst Sarah'
    })

    toast.success('Executive report generated successfully!')
  }

  // Duplicate Report
  const handleDuplicate = (id) => {
    duplicateReport(id)
    toast.success('Report duplicated!')
  }

  // Delete Report
  const handleDelete = (id) => {
    deleteReport(id)
    if (selectedReportId === id) {
      setSelectedReportId(null)
    }
    toast.success('Report deleted.')
  }

  // Apply Template values to form builder
  const handleApplyTemplate = (tpl) => {
    setReportTitle(`${tpl.title} - ${new Date().toLocaleDateString()}`)
    setReportType(tpl.type)
    setTimeRange(tpl.timeRange)
    toast.success('Template values applied to builder!')
  }

  // Configure Scheduling Preferences
  const handleSaveSchedule = (e) => {
    e.preventDefault()
    setScheduleActive(true)
    toast.success(`Report email delivery scheduled (${schedulePref})!`)
  }

  // Library Filtering / Searching
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const textMatch =
        search === '' ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.type.toLowerCase().includes(search.toLowerCase())

      if (!textMatch) return false

      if (filterType !== 'All' && r.type !== filterType) return false

      return true
    })
  }, [reports, search, filterType])

  const activeReportObj = useMemo(() => {
    if (!selectedReportId) return null
    return reports.find((r) => r.id === selectedReportId) || null
  }, [selectedReportId, reports])

  // EXPORT COMPILERS
  const handleExportCSV = () => {
    if (!activeReportObj) return
    const headers = ['Metric Attribute', 'Computed Value']
    const rows = activeReportObj.tableData.map(row => [`"${row.field}"`, `"${row.val}"`])
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Audit_Report_${activeReportObj.id}_Export.csv`)
    link.click()
  }

  const handleExportHTML = () => {
    if (!activeReportObj) return
    const metricsBlock = Object.entries(activeReportObj.metrics)
      .map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`)
      .join('\n')
    const tableBlock = activeReportObj.tableData
      .map(row => `<tr><td>${row.field}</td><td>${row.val}</td></tr>`)
      .join('\n')

    const htmlContent = `
    <html>
      <head>
        <title>${activeReportObj.title}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; color: #333; }
          h1 { color: #0284c7; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>${activeReportObj.title}</h1>
        <p><strong>Type:</strong> ${activeReportObj.type} | <strong>Compiled:</strong> ${new Date(activeReportObj.date).toLocaleString()}</p>
        <hr/>
        <h3>Executive Summary</h3>
        <p>${activeReportObj.summary}</p>
        <h3>Metrics Indicators</h3>
        <ul>${metricsBlock}</ul>
        <h3>Report Tabular Results</h3>
        <table>
          <thead>
            <tr><th>Attribute</th><th>Computed Value</th></tr>
          </thead>
          <tbody>${tableBlock}</tbody>
        </table>
      </body>
    </html>`

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Audit_Report_${activeReportObj.id}_Export.html`)
    link.click()
  }

  // Dynamic Skeletons for Loading States
  if (loading && reports.length === 0) {
    return (
      <div className='space-y-6'>
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`rep-skeleton-${idx}`}
              className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 shadow-xs'
            >
              <div className='flex items-center justify-between'>
                <Skeleton className='h-3.5 w-24' />
                <Skeleton className='h-8 w-8 rounded-xl' />
              </div>
              <Skeleton className='mt-4 h-8 w-24' />
              <Skeleton className='mt-2 h-3.5 w-40' />
            </div>
          ))}
        </div>
        <div className='grid gap-6 lg:grid-cols-3'>
          <div className='lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 h-96' />
          <div className='rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 h-96' />
        </div>
      </div>
    )
  }

  return (
    <section className='space-y-6 relative select-none'>
      {/* Banner / Header (No-print) */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-[linear-gradient(to_right,#e0f2fe,#f0fdf4,#ffffff)] p-5 shadow-xs dark:border-slate-800/80 dark:bg-[linear-gradient(to_right,rgba(14,165,233,0.1),rgba(16,185,129,0.1),rgba(2,6,23,0.7))] no-print'>
        <div>
          <p className='text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1.5'>
            <FileBarChart className='h-4 w-4 text-sky-505 animate-pulse' />
            Enterprise Compliance Audit Workspace
          </p>
          <h2 className='mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white'>
            Executive Reporting & Audit Center
          </h2>
          <p className='mt-1 text-sm text-slate-650 dark:text-slate-350 max-w-4xl'>
            Compile operational fraud exposure reports, verify compliance coverage dashboard gauges, track analyst audit trails, and export PDF summaries.
          </p>
        </div>
      </div>

      {/* KPI Indicators Grid (No-print) */}
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4 no-print'>
        <motion.div
          whileHover={{ y: -2 }}
          className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950/80'
        >
          <div className='absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-transparent -z-10' />
          <div className='flex items-center justify-between'>
            <p className='text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-500'>Reports Generated</p>
            <div className='grid h-8 w-8 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'>
              <FileText className='h-4.5 w-4.5' />
            </div>
          </div>
          <p className='font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mt-3'>
            {reports.length}
          </p>
          <p className='text-[10px] text-slate-400 font-semibold mt-1.5'>Compiled in local storage library</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950/80'
        >
          <div className='absolute inset-0 bg-linear-to-br from-rose-500/5 via-transparent to-transparent -z-10' />
          <div className='flex items-center justify-between'>
            <p className='text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-500'>Estimated Fraud Loss</p>
            <div className='grid h-8 w-8 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-950/40 dark:text-rose-450'>
              <DollarSign className='h-4.5 w-4.5' />
            </div>
          </div>
          <p className='font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mt-3'>
            {formatCurrency(liveStats.lossEstimate)}
          </p>
          <p className='text-[10px] text-slate-400 font-semibold mt-1.5'>Exposure from flagged fraud claims</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950/80'
        >
          <div className='absolute inset-0 bg-linear-to-br from-amber-500/5 via-transparent to-transparent -z-10' />
          <div className='flex items-center justify-between'>
            <p className='text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-500'>Open Case Load</p>
            <div className='grid h-8 w-8 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-450'>
              <Briefcase className='h-4.5 w-4.5' />
            </div>
          </div>
          <p className='font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mt-3'>
            {liveStats.openCases}
          </p>
          <p className='text-[10px] text-slate-400 font-semibold mt-1.5'>Investigations pending final closure</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950/80'
        >
          <div className='absolute inset-0 bg-linear-to-br from-emerald-500/5 via-transparent to-transparent -z-10' />
          <div className='flex items-center justify-between'>
            <p className='text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-500'>Compliance Readiness</p>
            <div className='grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'>
              <Percent className='h-4.5 w-4.5' />
            </div>
          </div>
          <p className='font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mt-3'>
            {liveStats.readinessScore}%
          </p>
          <p className='text-[10px] text-slate-400 font-semibold mt-1.5'>Mean compliance readiness rating</p>
        </motion.div>
      </div>

      {/* Main Workspace split panel layout */}
      <div className='grid gap-6 lg:grid-cols-3 no-print'>
        {/* Left Column: Builder, Templates, Logs (Takes 1/3 width) */}
        <div className='lg:col-span-1 space-y-6'>
          
          {/* Report Builder Controls Card */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 flex items-center gap-2'>
                <ClipboardList className='h-4 w-4 text-sky-505' /> Custom Report Builder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateReport} className='space-y-4 text-xs font-semibold'>
                <div>
                  <label className='block text-slate-450 uppercase mb-1'>Report Title Name</label>
                  <input
                    type='text'
                    placeholder='e.g., Q2 Compliance Audit Briefing'
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className='w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 outline-hidden focus:border-sky-505 focus:bg-white dark:border-slate-800 dark:bg-slate-900'
                  />
                </div>

                <div>
                  <label className='block text-slate-450 uppercase mb-1'>Select Report Template Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className='w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 outline-hidden dark:border-slate-800 dark:bg-slate-900'
                  >
                    <option value='Executive Summary'>Executive Summary</option>
                    <option value='Fraud Loss Summary'>Fraud Loss Summary</option>
                    <option value='Provider Risk Review'>Provider Risk Review</option>
                    <option value='Compliance Document Audit'>Compliance Document Audit</option>
                  </select>
                </div>

                <div>
                  <label className='block text-slate-450 uppercase mb-1'>Audit Time Range Scope</label>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className='w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 outline-hidden dark:border-slate-800 dark:bg-slate-900'
                  >
                    <option value='Last 30 Days'>Last 30 Days</option>
                    <option value='Last 90 Days'>Last 90 Days</option>
                    <option value='Year to Date'>Year to Date</option>
                  </select>
                </div>

                <button
                  type='submit'
                  disabled={!reportTitle.trim()}
                  className='w-full py-2.5 px-4 rounded-xl bg-sky-600 text-white hover:bg-sky-705 transition font-bold disabled:opacity-50 shadow-xs'
                >
                  Compile & Generate Report
                </button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Start Templates Panel */}
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 flex items-center justify-between'>
                <span>Template Quick Start presets</span>
                <Sliders className='h-3.5 w-3.5' />
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-1 space-y-2 max-h-56 overflow-y-auto scrollbar-none'>
              {reportTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => handleApplyTemplate(tpl)}
                  className='p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100 cursor-pointer text-left text-xs transition dark:border-slate-900 dark:bg-slate-900/40 dark:hover:bg-slate-900/80'
                >
                  <p className='font-bold text-slate-800 dark:text-slate-200'>{tpl.title}</p>
                  <p className='text-[9px] text-slate-400 font-semibold mt-0.5 leading-relaxed'>{tpl.desc}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Scheduled Report Settings Card */}
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 flex items-center justify-between'>
                <span>Automated Report Scheduling</span>
                <Mail className='h-3.5 w-3.5' />
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-2'>
              <form onSubmit={handleSaveSchedule} className='space-y-3.5 text-xs font-semibold'>
                <div className='flex gap-2 items-center'>
                  <div className='flex-1'>
                    <label className='block text-[10px] text-slate-450 uppercase mb-0.5'>Frequency</label>
                    <select
                      value={schedulePref}
                      onChange={(e) => setSchedulePref(e.target.value)}
                      className='w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2 outline-hidden dark:border-slate-800 dark:bg-slate-900'
                    >
                      <option value='Daily'>Daily</option>
                      <option value='Weekly'>Weekly</option>
                      <option value='Monthly'>Monthly</option>
                    </select>
                  </div>
                  <div className='flex-1'>
                    <label className='block text-[10px] text-slate-450 uppercase mb-0.5'>Auditor Email</label>
                    <input
                      type='email'
                      placeholder='auditors@platform.com'
                      value={scheduleEmail}
                      onChange={(e) => setScheduleEmail(e.target.value)}
                      className='w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2 outline-hidden dark:border-slate-800 dark:bg-slate-900'
                    />
                  </div>
                </div>

                <button
                  type='submit'
                  className='w-full py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition text-[11px] font-bold dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                >
                  {scheduleActive ? 'Update Schedule Preference' : 'Enable Automated Schedule'}
                </button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Center/Right Column: Saved Library & Live Previews (Takes 2/3 width) */}
        <div className='lg:col-span-2 space-y-6'>
          
          <div className='grid gap-6 md:grid-cols-2'>
            {/* Library list panel */}
            <Card className='max-h-76 flex flex-col justify-between overflow-hidden'>
              <CardHeader className='pb-2.5'>
                <CardTitle className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 flex items-center justify-between'>
                  <span>Generated Report archive</span>
                  <span className='text-[10px] font-normal text-slate-400 italic'>{filteredReports.length} reports</span>
                </CardTitle>
              </CardHeader>
              <CardContent className='flex-1 overflow-y-auto space-y-2 pt-1 scrollbar-none'>
                <div className='relative mb-2.5'>
                  <Search className='absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400' />
                  <input
                    type='text'
                    placeholder='Search report title...'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-4 text-xs placeholder-slate-400 dark:border-slate-800 dark:bg-slate-900'
                  />
                </div>

                {filteredReports.length === 0 ? (
                  <div className='text-center py-6 text-xs text-slate-400 italic'>No reports found. Build one above.</div>
                ) : (
                  filteredReports.map((r) => {
                    const isSelected = selectedReportId === r.id
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedReportId(r.id)}
                        className={cn(
                          'p-3 rounded-xl border cursor-pointer flex flex-col gap-1.5 transition',
                          isSelected
                            ? 'bg-sky-500/10 border-sky-500 dark:bg-sky-950/20'
                            : 'bg-slate-50/30 border-slate-100 hover:bg-slate-100/80 dark:bg-slate-900/10 dark:border-slate-900 dark:hover:bg-slate-900/60'
                        )}
                      >
                        <div className='flex items-center justify-between'>
                          <span className='text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-40'>{r.title}</span>
                          <span className='text-[8px] bg-slate-200/80 dark:bg-slate-800 text-slate-650 dark:text-slate-350 rounded px-1.5 py-0.5 font-bold uppercase shrink-0'>
                            {r.type}
                          </span>
                        </div>
                        <div className='flex items-center justify-between text-[9px] text-slate-400 font-semibold'>
                          <span>Timeframe: {r.timeRange} &bull; Compiled: {new Date(r.date).toLocaleDateString()}</span>
                          <div className='flex gap-1.5 z-10' onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleDuplicate(r.id)} title='Duplicate report' className='text-slate-405 hover:text-sky-555'>
                              <Copy className='h-3 w-3' />
                            </button>
                            <button onClick={() => handleDelete(r.id)} title='Delete report' className='text-slate-405 hover:text-rose-555'>
                              <Trash2 className='h-3 w-3' />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            {/* Audit Timeline panel */}
            <Card className='max-h-76 flex flex-col justify-between overflow-hidden'>
              <CardHeader className='pb-2.5'>
                <CardTitle className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 flex items-center gap-1.5'>
                  <ClipboardList className='h-4 w-4 text-emerald-500 animate-pulse' /> Audit Activity timeline trails
                </CardTitle>
              </CardHeader>
              <CardContent className='flex-1 overflow-y-auto pt-1 space-y-3.5 scrollbar-none'>
                <div className='relative pl-4 border-l border-slate-200 dark:border-slate-800 ml-1.5 space-y-4'>
                  {auditLogs.slice(0, 8).map((log) => (
                    <div key={log.id} className='relative text-[10px] leading-relaxed'>
                      <div className='absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white dark:border-slate-950' />
                      <div className='flex justify-between font-bold text-slate-800 dark:text-slate-200'>
                        <span>{log.action}</span>
                        <span className='text-[8px] font-normal text-slate-400'>{new Date(log.date).toLocaleDateString()}</span>
                      </div>
                      <p className='text-[9px] text-slate-450 dark:text-slate-400 font-semibold mt-0.5'>{log.details}</p>
                      <p className='text-[8px] text-slate-400 font-medium italic mt-0.5'>Performed by: {log.analyst}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Report Preview Panel */}
          <AnimatePresence mode='wait'>
            {activeReportObj ? (
              <motion.div
                key={activeReportObj.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className='w-full'
              >
                <Card className='border-sky-500/25 relative overflow-hidden'>
                  <CardHeader className='pb-3 bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-900 flex flex-row items-center justify-between'>
                    <div>
                      <Badge className='bg-sky-505/10 text-sky-655 border-none font-bold uppercase text-[9px] mb-1.5'>
                        {activeReportObj.type}
                      </Badge>
                      <CardTitle className='text-sm font-bold text-slate-900 dark:text-slate-100'>
                        {activeReportObj.title}
                      </CardTitle>
                      <p className='text-[10px] text-slate-405 font-semibold mt-0.5'>
                        Audit Period: {activeReportObj.timeRange} &bull; Generated: {new Date(activeReportObj.date).toLocaleString()}
                      </p>
                    </div>

                    <div className='flex gap-1.5 shrink-0'>
                      <button
                        onClick={handleExportCSV}
                        className='p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-600 dark:border-slate-850 dark:hover:bg-slate-900 dark:text-slate-400 transition flex items-center gap-1 shadow-xs'
                      >
                        <Download className='h-3 w-3' /> CSV
                      </button>
                      <button
                        onClick={handleExportHTML}
                        className='p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-600 dark:border-slate-850 dark:hover:bg-slate-900 dark:text-slate-400 transition flex items-center gap-1 shadow-xs'
                      >
                        <FileText className='h-3 w-3' /> HTML
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className='p-5 space-y-6'>
                    {/* Executive summary block */}
                    <div className='p-4 rounded-xl bg-slate-50/60 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-900 space-y-1 text-xs'>
                      <span className='text-[9px] font-bold text-slate-400 uppercase block mb-1'>Executive Audit Summary</span>
                      <p className='text-slate-650 dark:text-slate-300 leading-relaxed font-semibold'>
                        {activeReportObj.summary}
                      </p>
                    </div>

                    {/* Indicators list */}
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-700 dark:text-slate-350'>
                      <div className='p-3.5 rounded-xl border border-slate-100 bg-slate-50/30 dark:border-slate-900 dark:bg-slate-900/10'>
                        <span className='text-[8px] font-bold text-slate-400 block uppercase mb-1'>Loss exposure</span>
                        <span className='text-slate-900 dark:text-white font-bold block mt-0.5'>{formatCurrency(activeReportObj.metrics.lossEstimate)}</span>
                      </div>
                      <div className='p-3.5 rounded-xl border border-slate-100 bg-slate-50/30 dark:border-slate-900 dark:bg-slate-900/10'>
                        <span className='text-[8px] font-bold text-slate-400 block uppercase mb-1'>Open case count</span>
                        <span className='text-sky-505 block font-bold mt-0.5'>{activeReportObj.metrics.openCases} cases</span>
                      </div>
                      <div className='p-3.5 rounded-xl border border-slate-100 bg-slate-50/30 dark:border-slate-900 dark:bg-slate-900/10'>
                        <span className='text-[8px] font-bold text-slate-400 block uppercase mb-1'>Mismatch forms</span>
                        <span className='text-rose-500 block font-bold mt-0.5'>{activeReportObj.metrics.mismatchDocs} forms</span>
                      </div>
                      <div className='p-3.5 rounded-xl border border-slate-100 bg-slate-50/30 dark:border-slate-900 dark:bg-slate-900/10'>
                        <span className='text-[8px] font-bold text-slate-400 block uppercase mb-1'>Readiness Score</span>
                        <span className='text-emerald-500 block font-bold mt-0.5'>{activeReportObj.metrics.readiness}%</span>
                      </div>
                    </div>

                    {/* Split preview block with Recharts & Data Table */}
                    <div className='grid gap-6 md:grid-cols-2'>
                      
                      {/* Left: Table details */}
                      <div className='space-y-3'>
                        <span className='text-[9px] font-bold text-slate-400 uppercase block'>Audit Indicators Registry</span>
                        <div className='border border-slate-100 dark:border-slate-900 rounded-xl overflow-hidden'>
                          <table className='w-full text-xs text-left border-collapse'>
                            <thead>
                              <tr className='bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-900 text-slate-405 font-bold uppercase text-[9px]'>
                                <th className='p-2.5'>Metric Indicator</th>
                                <th className='p-2.5 text-right'>Computed Result</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeReportObj.tableData.map((row, rIdx) => (
                                <tr key={rIdx} className='border-b border-slate-100 dark:border-slate-900 last:border-none font-semibold text-slate-700 dark:text-slate-350'>
                                  <td className='p-2.5'>{row.field}</td>
                                  <td className='p-2.5 text-right text-slate-900 dark:text-white font-bold'>{row.val}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Right: Recharts data representation */}
                      <div className='space-y-3 h-52 flex flex-col justify-between'>
                        <span className='text-[9px] font-bold text-slate-400 uppercase block mb-1'>Visual data exposure chart</span>
                        <div className='flex-1 mt-1 bg-slate-50/30 border border-slate-100 rounded-xl dark:bg-slate-900/10 dark:border-slate-900 p-2'>
                          <ResponsiveContainer width='100%' height='100%'>
                            <BarChart data={activeReportObj.chartsData}>
                              <XAxis dataKey='name' tick={{ fontSize: 9 }} stroke='#64748b' />
                              <YAxis tick={{ fontSize: 9 }} stroke='#64748b' />
                              <ChartTooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                              <Bar dataKey='value' fill='#0284c7' radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className='w-full'>
                <EmptyState
                  title='No Report Selected'
                  description='Select a generated report from the archive library above, or use the builder form to compile a new audit docket.'
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Hidden Print Area specifically formatted for executive audits */}
      <div className='hidden print-area space-y-6'>
        <div className='border-b-2 border-slate-300 pb-4'>
          <h1 className='text-2xl font-bold'>Healthcare AI Platform - Compliance Audit & Executive Report</h1>
          <p className='text-xs text-slate-500 mt-1'>Report generated on: {new Date().toLocaleString()}</p>
        </div>

        {activeReportObj && (
          <div className='space-y-6'>
            <div className='print-card border border-slate-200 p-4 rounded-xl'>
              <h2 className='text-lg font-bold'>{activeReportObj.title}</h2>
              <p className='text-xs text-slate-500 mt-1'>Type: {activeReportObj.type} | Timeframe: {activeReportObj.timeRange}</p>
              <div className='mt-4 text-xs font-semibold whitespace-pre-wrap leading-relaxed'>{activeReportObj.summary}</div>
            </div>

            <div className='print-card border border-slate-200 p-4 rounded-xl'>
              <h3 className='text-sm font-bold uppercase text-slate-500 mb-3'>Report Tabular Registry</h3>
              <table className='w-full text-xs text-left border-collapse'>
                <thead>
                  <tr className='border-b border-slate-350'>
                    <th className='py-2'>Audit Metric</th>
                    <th className='py-2 text-right'>Computed Result</th>
                  </tr>
                </thead>
                <tbody>
                  {activeReportObj.tableData.map((row, rIdx) => (
                    <tr key={rIdx} className='border-b border-slate-200'>
                      <td className='py-2'>{row.field}</td>
                      <td className='py-2 text-right font-bold'>{row.val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
