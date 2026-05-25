import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
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
  Network,
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
  Check,
  Eye,
  Info,
  DollarSign,
  TrendingUp,
  Star,
  Save,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  Pin,
  Bookmark,
  Plus,
  Share2
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useApi } from '@/hooks/useApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/utils/cn'

// Inline currency & percent formatters
const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
const formatPercent = (val) =>
  new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(val)

const COLUMN_MAP = {
  Provider: 0,
  Claim: 1,
  Alert: 2,
  Investigation: 3,
  Document: 4
}

const getRiskColor = (score) => {
  if (score >= 75) return '#f43f5e' // Rose
  if (score >= 50) return '#f97316' // Orange
  if (score >= 25) return '#eab308' // Amber
  return '#10b981' // Emerald
}

const getRiskBadge = (score) => {
  if (score >= 75)
    return (
      <span className='inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-rose-700 dark:bg-rose-950/40 dark:text-rose-350'>
        Critical
      </span>
    )
  if (score >= 50)
    return (
      <span className='inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-orange-700 dark:bg-orange-950/40 dark:text-orange-350'>
        High
      </span>
    )
  if (score >= 25)
    return (
      <span className='inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-950/40 dark:text-amber-350'>
        Medium
      </span>
    )
  return (
    <span className='inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-350'>
      Low
    </span>
  )
}

export default function NetworkAnalysis() {
  const alerts = useStore((state) => state.alerts || [])
  const cases = useStore((state) => state.cases || [])
  const documents = useStore((state) => state.documents || [])
  const history = useStore((state) => state.history || [])
  const providerWatchlist = useStore((state) => state.providerWatchlist || [])
  const providerFlags = useStore((state) => state.providerFlags || {})
  
  const networkAnnotations = useStore((state) => state.networkAnnotations || {})
  const savedNetworkViews = useStore((state) => state.savedNetworkViews || [])
  
  const addNetworkAnnotation = useStore((state) => state.addNetworkAnnotation)
  const deleteNetworkAnnotation = useStore((state) => state.deleteNetworkAnnotation)
  const saveNetworkView = useStore((state) => state.saveNetworkView)
  
  const loading = useStore((state) => state.loadingByKey?.history)
  const { fetchHistory } = useApi()

  // Selection & Canvas States
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [search, setSearch] = useState('')
  const [filterRiskLevel, setFilterRiskLevel] = useState('All')
  const [filterType, setFilterType] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')

  // Zoom & Pan States
  const [zoomScale, setZoomScale] = useState(0.85)
  const [panX, setPanX] = useState(40)
  const [panY, setPanY] = useState(20)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const svgRef = useRef(null)

  // Annotation Editor States
  const [noteText, setNoteText] = useState('')

  // Saved View Modal States
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [newViewName, setNewViewName] = useState('')
  const [newViewDesc, setNewViewDesc] = useState('')

  // Load claim history records on mount
  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Sync Note Text with Selected Node
  useEffect(() => {
    if (selectedNodeId) {
      setNoteText(networkAnnotations[selectedNodeId] || '')
    } else {
      setNoteText('')
    }
  }, [selectedNodeId, networkAnnotations])

  // 1. Compile Graph Entities with Mock Fallback data if Store is empty
  const graphData = useMemo(() => {
    const nodesMap = new Map()
    const linksList = []

    // Helper: Safe node registration
    const registerNode = (id, label, type, riskScore, metadata = {}) => {
      if (!nodesMap.has(id)) {
        nodesMap.set(id, { id, label, type, riskScore, metadata })
      } else {
        // Update existing node properties if we find a higher riskScore
        const existing = nodesMap.get(id)
        if (riskScore > existing.riskScore) {
          existing.riskScore = riskScore
        }
        existing.metadata = { ...existing.metadata, ...metadata }
      }
    }

    // Dynamic extraction: Providers
    const activeProviders = new Set()
    history.forEach((h) => {
      if (h.claim?.provider) activeProviders.add(h.claim.provider)
    })
    alerts.forEach((a) => {
      if (a.provider) activeProviders.add(a.provider)
    })
    cases.forEach((c) => {
      if (c.provider) activeProviders.add(c.provider)
    })

    // Fallbacks if store lists are empty
    if (activeProviders.size === 0) {
      // Mock Providers
      registerNode('Provider B', 'Provider B', 'Provider', 82, {
        claimsCount: 24,
        totalClaimAmount: 320000,
        fraudCount: 8,
        alertCount: 5,
        investigationCount: 2,
        resolvedCount: 0
      })
      registerNode('Provider C', 'Provider C', 'Provider', 68, {
        claimsCount: 18,
        totalClaimAmount: 216000,
        fraudCount: 5,
        alertCount: 3,
        investigationCount: 1,
        resolvedCount: 0
      })
      registerNode('Provider A', 'Provider A', 'Provider', 24, {
        claimsCount: 30,
        totalClaimAmount: 145000,
        fraudCount: 2,
        alertCount: 1,
        investigationCount: 1,
        resolvedCount: 1
      })
      registerNode('Provider D', 'Provider D', 'Provider', 18, {
        claimsCount: 15,
        totalClaimAmount: 62000,
        fraudCount: 1,
        alertCount: 0,
        investigationCount: 0,
        resolvedCount: 0
      })

      // Mock Claims
      const mockClaims = [
        { id: 'CL-7701', provider: 'Provider B', amount: 45000, procedures: 5, riskScore: 88, status: 'Flagged' },
        { id: 'CL-7702', provider: 'Provider B', amount: 28000, procedures: 4, riskScore: 78, status: 'Flagged' },
        { id: 'CL-7703', provider: 'Provider B', amount: 15000, procedures: 2, riskScore: 55, status: 'Flagged' },
        { id: 'CL-7704', provider: 'Provider C', amount: 38050, procedures: 3, riskScore: 82, status: 'Flagged' },
        { id: 'CL-7705', provider: 'Provider C', amount: 12000, procedures: 1, riskScore: 15, status: 'Verified' },
        { id: 'CL-7706', provider: 'Provider A', amount: 8400, procedures: 2, riskScore: 22, status: 'Verified' },
        { id: 'CL-7707', provider: 'Provider A', amount: 4800, procedures: 1, riskScore: 10, status: 'Verified' },
        { id: 'CL-7708', provider: 'Provider D', amount: 19500, procedures: 3, riskScore: 61, status: 'Flagged' }
      ]
      mockClaims.forEach((cl) => {
        registerNode(cl.id, cl.id, 'Claim', cl.riskScore, {
          amount: cl.amount,
          procedures: cl.procedures,
          provider: cl.provider,
          status: cl.status
        })
        linksList.push({ source: cl.provider, target: cl.id, type: 'provider-claim' })
      })

      // Mock Alerts
      const mockAlerts = [
        { id: 'AL-9901', claimId: 'CL-7701', riskScore: 92, severity: 'Critical', status: 'New', provider: 'Provider B' },
        { id: 'AL-9902', claimId: 'CL-7702', riskScore: 78, severity: 'High', status: 'Under Review', provider: 'Provider B' },
        { id: 'AL-9903', claimId: 'CL-7703', riskScore: 52, severity: 'Medium', status: 'New', provider: 'Provider B' },
        { id: 'AL-9904', claimId: 'CL-7704', riskScore: 84, severity: 'High', status: 'Investigating', provider: 'Provider C' },
        { id: 'AL-9905', claimId: 'CL-7708', riskScore: 63, severity: 'Medium', status: 'New', provider: 'Provider D' }
      ]
      mockAlerts.forEach((al) => {
        registerNode(al.id, al.id, 'Alert', al.riskScore, {
          severity: al.severity,
          status: al.status,
          claimId: al.claimId,
          provider: al.provider
        })
        linksList.push({ source: al.claimId, target: al.id, type: 'claim-alert' })
      })

      // Mock Cases
      const mockCases = [
        { id: 'CASE-9901', alertId: 'AL-9901', riskScore: 90, status: 'Investigating', priority: 'Critical', assignedTo: 'Analyst Sarah', provider: 'Provider B' },
        { id: 'CASE-9902', alertId: 'AL-9904', riskScore: 75, status: 'Under Review', priority: 'High', assignedTo: 'Analyst Dave', provider: 'Provider C' },
        { id: 'CASE-9903', alertId: 'AL-9905', riskScore: 48, status: 'New', priority: 'Medium', assignedTo: 'Unassigned', provider: 'Provider D' }
      ]
      mockCases.forEach((cs) => {
        registerNode(cs.id, cs.id, 'Investigation', cs.riskScore, {
          status: cs.status,
          priority: cs.priority,
          assignedTo: cs.assignedTo,
          alertId: cs.alertId,
          provider: cs.provider
        })
        linksList.push({ source: cs.alertId, target: cs.id, type: 'alert-case' })
      })

      // Mock Documents
      const mockDocs = [
        { id: 'DOC-201', claimId: 'CL-7701', riskScore: 85, status: 'Mismatch', type: 'UB-04 Claim Form', discrepancy: 'Billed codes mismatch OCR' },
        { id: 'DOC-202', claimId: 'CL-7702', riskScore: 80, status: 'Mismatch', type: 'Itemized Bill', discrepancy: 'Double-billing detected' },
        { id: 'DOC-203', claimId: 'CL-7705', riskScore: 10, status: 'Verified', type: 'Discharge Summary', discrepancy: 'None' },
        { id: 'DOC-204', claimId: 'CL-7706', riskScore: 12, status: 'Verified', type: 'UB-04 Claim Form', discrepancy: 'None' }
      ]
      mockDocs.forEach((doc) => {
        registerNode(doc.id, doc.id, 'Document', doc.riskScore, {
          status: doc.status,
          type: doc.type,
          claimId: doc.claimId,
          discrepancy: doc.discrepancy
        })
        linksList.push({ source: doc.claimId, target: doc.id, type: 'claim-document' })
      })
    } else {
      // 1. Process real providers
      activeProviders.forEach((pName) => {
        const watchlist = providerWatchlist.includes(pName)
        const flag = providerFlags[pName] || ''
        let riskScore = watchlist ? 35 : 15
        registerNode(pName, pName, 'Provider', riskScore, {
          watchlist,
          flag,
          claimsCount: 0,
          totalClaimAmount: 0,
          fraudCount: 0,
          alertCount: 0,
          investigationCount: 0
        })
      })

      // 2. Process claims (from history)
      history.forEach((h, idx) => {
        const claim = h.claim || {}
        const pred = h.latest_prediction || {}
        const claimId = claim.id || `CL-88${idx}`
        const amount = claim.claim_amount || 0
        const provider = claim.provider || 'Unknown Provider'
        const isFraud = pred.prediction === 1
        const riskScore = Math.round((pred.confidence || 0) * 100)

        registerNode(claimId, claimId, 'Claim', riskScore, {
          amount,
          procedures: claim.num_procedures || 1,
          provider,
          status: isFraud ? 'Flagged' : 'Verified'
        })

        // Ensure provider node is populated with statistics
        if (provider) {
          registerNode(provider, provider, 'Provider', 20)
          const pNode = nodesMap.get(provider)
          pNode.metadata.claimsCount = (pNode.metadata.claimsCount || 0) + 1
          pNode.metadata.totalClaimAmount = (pNode.metadata.totalClaimAmount || 0) + amount
          if (isFraud) {
            pNode.metadata.fraudCount = (pNode.metadata.fraudCount || 0) + 1
          }
          linksList.push({ source: provider, target: claimId, type: 'provider-claim' })
        }
      })

      // 3. Process Alerts
      alerts.forEach((al) => {
        const riskScore = Math.round(al.riskScore ? (al.riskScore <= 1 ? al.riskScore * 100 : al.riskScore) : 45)
        registerNode(al.id, al.id, 'Alert', riskScore, {
          severity: al.severity || 'Medium',
          status: al.status || 'New',
          claimId: al.claimId,
          provider: al.provider
        })

        if (al.provider && nodesMap.has(al.provider)) {
          const pNode = nodesMap.get(al.provider)
          pNode.metadata.alertCount = (pNode.metadata.alertCount || 0) + 1
        }

        if (al.claimId) {
          linksList.push({ source: al.claimId, target: al.id, type: 'claim-alert' })
        }
      })

      // 4. Process Cases (Investigations)
      cases.forEach((cs) => {
        const riskScore = cs.riskScore || 50
        registerNode(cs.id, cs.id, 'Investigation', riskScore, {
          status: cs.status || 'New',
          priority: cs.priority || 'Medium',
          assignedTo: cs.assignedTo || 'Unassigned',
          alertId: cs.alertId,
          claimId: cs.claimId,
          provider: cs.provider
        })

        if (cs.provider && nodesMap.has(cs.provider)) {
          const pNode = nodesMap.get(cs.provider)
          pNode.metadata.investigationCount = (pNode.metadata.investigationCount || 0) + 1
        }

        if (cs.alertId) {
          linksList.push({ source: cs.alertId, target: cs.id, type: 'alert-case' })
        } else if (cs.claimId) {
          linksList.push({ source: cs.claimId, target: cs.id, type: 'claim-case' })
        }
      })

      // 5. Process Documents
      documents.forEach((doc) => {
        const claimId = doc.claimId || doc.extractedData?.claimId
        const riskScore = doc.status === 'Mismatch' ? 80 : 15
        registerNode(doc.id, doc.name || doc.id, 'Document', riskScore, {
          status: doc.status || 'Pending',
          type: doc.type || 'Medical Record',
          claimId,
          discrepancy: doc.discrepancy || 'None'
        })

        if (claimId) {
          linksList.push({ source: claimId, target: doc.id, type: 'claim-document' })
        }
      })
    }

    return {
      nodes: Array.from(nodesMap.values()),
      links: linksList
    }
  }, [history, alerts, cases, documents, providerWatchlist, providerFlags])

  // 2. Multi-Level Graph Neighborhood Filtering
  const filteredGraph = useMemo(() => {
    const { nodes, links } = graphData
    
    // Find explicitly matching nodes first
    const explicitMatches = new Set()
    
    nodes.forEach((n) => {
      // Text search match
      const textMatch =
        search === '' ||
        n.id.toLowerCase().includes(search.toLowerCase()) ||
        (n.label && n.label.toLowerCase().includes(search.toLowerCase())) ||
        (n.metadata?.provider && n.metadata.provider.toLowerCase().includes(search.toLowerCase()))

      if (!textMatch) return

      // Type Filter
      if (filterType !== 'All' && n.type !== filterType) return

      // Risk Level Filter
      if (filterRiskLevel !== 'All') {
        const isCritical = n.riskScore >= 75
        const isHigh = n.riskScore >= 50 && n.riskScore < 75
        const isMedium = n.riskScore >= 25 && n.riskScore < 50
        const isLow = n.riskScore < 25

        if (filterRiskLevel === 'Critical' && !isCritical) return
        if (filterRiskLevel === 'High' && !isHigh) return
        if (filterRiskLevel === 'Medium' && !isMedium) return
        if (filterRiskLevel === 'Low' && !isLow) return
      }

      // Status Filter
      if (filterStatus !== 'All') {
        const status = n.metadata?.status || n.metadata?.severity || ''
        if (status.toLowerCase() !== filterStatus.toLowerCase()) return
      }

      explicitMatches.add(n.id)
    })

    // Neighborhood Expansion (1-hop)
    const finalNodesSet = new Set(explicitMatches)
    const finalLinks = []

    links.forEach((l) => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source
      const targetId = typeof l.target === 'object' ? l.target.id : l.target

      // Include connection if either endpoint matches the filter criteria
      if (explicitMatches.has(sourceId) || explicitMatches.has(targetId)) {
        finalNodesSet.add(sourceId)
        finalNodesSet.add(targetId)
        finalLinks.push(l)
      }
    })

    // Retain nodes that are in finalNodesSet
    const finalNodes = nodes.filter((n) => finalNodesSet.has(n.id))

    return { nodes: finalNodes, links: finalLinks }
  }, [graphData, search, filterType, filterRiskLevel, filterStatus])

  // 3. Layout Node Positions dynamically in column columns
  const layout = useMemo(() => {
    const { nodes, links } = filteredGraph
    
    const columns = {
      Provider: [],
      Claim: [],
      Alert: [],
      Investigation: [],
      Document: []
    }

    nodes.forEach((n) => {
      if (columns[n.type]) {
        columns[n.type].push(n)
      }
    })

    const maxCount = Math.max(
      columns.Provider.length,
      columns.Claim.length,
      columns.Alert.length,
      columns.Investigation.length,
      columns.Document.length,
      1
    )

    // Dynamic height spacing
    const canvasHeight = Math.max(580, maxCount * 80 + 100)
    const canvasWidth = 1000

    const positionedNodes = nodes.map((node) => {
      const colNodes = columns[node.type]
      const index = colNodes.indexOf(node)
      const count = colNodes.length

      // Center items inside each column
      const spacing = count > 1 ? (canvasHeight - 140) / (count - 1) : 0
      const startY = count > 1 ? 70 : canvasHeight / 2
      const y = count > 1 ? startY + index * spacing : startY
      const x = 70 + COLUMN_MAP[node.type] * 210

      return {
        ...node,
        x,
        y
      }
    })

    // Map source and target IDs to coordinates for layout connections
    const mappedLinks = links
      .map((l) => {
        const sourceNode = positionedNodes.find((n) => n.id === (typeof l.source === 'object' ? l.source.id : l.source))
        const targetNode = positionedNodes.find((n) => n.id === (typeof l.target === 'object' ? l.target.id : l.target))

        if (!sourceNode || !targetNode) return null

        return {
          ...l,
          sourceNode,
          targetNode
        }
      })
      .filter(Boolean)

    return {
      nodes: positionedNodes,
      links: mappedLinks,
      width: canvasWidth,
      height: canvasHeight
    }
  }, [filteredGraph])

  // Determine connected nodes of the active selected node for path highlight
  const selectedNeighborhood = useMemo(() => {
    if (!selectedNodeId) return null
    const neighbors = new Set([selectedNodeId])
    const activeLinks = []

    graphData.links.forEach((l) => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source
      const targetId = typeof l.target === 'object' ? l.target.id : l.target

      if (sourceId === selectedNodeId) {
        neighbors.add(targetId)
        activeLinks.push(l)
      } else if (targetId === selectedNodeId) {
        neighbors.add(sourceId)
        activeLinks.push(l)
      }
    })

    // Recursively find 2-hop links in the cluster so the analyst sees full linkage context
    graphData.links.forEach((l) => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source
      const targetId = typeof l.target === 'object' ? l.target.id : l.target

      if (neighbors.has(sourceId) && !neighbors.has(targetId)) {
        // Let's verify if they are in the same provider hierarchy
        neighbors.add(targetId)
        activeLinks.push(l)
      } else if (neighbors.has(targetId) && !neighbors.has(sourceId)) {
        neighbors.add(sourceId)
        activeLinks.push(l)
      }
    })

    return {
      nodes: neighbors,
      links: activeLinks
    }
  }, [selectedNodeId, graphData.links])

  // 4. Automatic Suspicious Clusters Detection
  const suspiciousClusters = useMemo(() => {
    // Map providers to their connected sub-networks
    const { nodes, links } = graphData
    const providers = nodes.filter((n) => n.type === 'Provider')
    
    return providers
      .map((p) => {
        // Get all claims billed by this provider
        const connectedClaims = links
          .filter((l) => l.source === p.id && l.type === 'provider-claim')
          .map((l) => l.target)

        // Get alerts triggered by these claims
        const connectedAlerts = links
          .filter((l) => l.type === 'claim-alert' && connectedClaims.includes(l.source))
          .map((l) => l.target)

        // Get cases escalated from these alerts
        const connectedCases = links
          .filter((l) => l.type === 'alert-case' && connectedAlerts.includes(l.source))
          .map((l) => l.target)

        // Get documents verified against these claims
        const connectedDocs = links
          .filter((l) => l.type === 'claim-document' && connectedClaims.includes(l.source))
          .map((l) => l.target)

        const totalClaims = connectedClaims.length
        const totalAlerts = connectedAlerts.length
        const totalCases = connectedCases.length
        const totalDocs = connectedDocs.length
        const totalConnectedCount = 1 + totalClaims + totalAlerts + totalCases + totalDocs

        // Gather risk values
        const childNodes = nodes.filter((n) => connectedClaims.includes(n.id) || connectedAlerts.includes(n.id) || connectedCases.includes(n.id))
        const sumScores = childNodes.reduce((acc, curr) => acc + curr.riskScore, 0)
        const avgChildRisk = childNodes.length > 0 ? sumScores / childNodes.length : 0

        // Calculate Cluster Risk Score
        // Base weight: Provider Risk
        // Modifiers: alert ratio, active case volume, document verification failures
        const alertDensityModifier = totalClaims > 0 ? (totalAlerts / totalClaims) * 20 : 0
        const caseModifier = totalCases * 15
        const documentMismatchCount = nodes.filter((n) => connectedDocs.includes(n.id) && n.metadata?.status === 'Mismatch').length
        const docMismatchModifier = documentMismatchCount * 20

        const clusterRiskScore = Math.round(
          Math.min(p.riskScore * 0.4 + avgChildRisk * 0.3 + alertDensityModifier + caseModifier + docMismatchModifier, 100)
        )

        let priority = 'Low'
        if (clusterRiskScore >= 75) priority = 'Immediate Audit'
        else if (clusterRiskScore >= 50) priority = 'High'
        else if (clusterRiskScore >= 25) priority = 'Medium'

        return {
          providerName: p.id,
          riskScore: clusterRiskScore,
          priority,
          entityCount: totalConnectedCount,
          breakdown: {
            claims: totalClaims,
            alerts: totalAlerts,
            cases: totalCases,
            documents: totalDocs
          }
        }
      })
      .sort((a, b) => b.riskScore - a.riskScore)
  }, [graphData])

  // 5. Network Risk Scoring Engine
  const networkRiskScoring = useMemo(() => {
    if (graphData.nodes.length === 0) return { score: 0, category: 'Low' }

    let sum = 0
    let highCount = 0
    let criticalCount = 0

    graphData.nodes.forEach((n) => {
      sum += n.riskScore
      if (n.riskScore >= 75) criticalCount++
      else if (n.riskScore >= 50) highCount++
    })

    const avg = sum / graphData.nodes.length
    // Compound score: weight average with volume of critical nodes
    const compoundScore = Math.round(Math.min(avg * 0.6 + criticalCount * 8 + highCount * 3, 100))

    let category = 'Low'
    if (compoundScore >= 75) category = 'Critical'
    else if (compoundScore >= 50) category = 'High'
    else if (compoundScore >= 25) category = 'Medium'

    return {
      score: compoundScore,
      category
    }
  }, [graphData.nodes])

  // 6. Timeline of Selected Node
  const selectedTimeline = useMemo(() => {
    if (!selectedNodeId) return []
    const nodeObj = graphData.nodes.find((n) => n.id === selectedNodeId)
    if (!nodeObj) return []

    // If selected is a provider, compile chronological action events
    if (nodeObj.type === 'Provider') {
      const provName = nodeObj.id
      const timelineEvents = []

      // Link alert, claims, cases events
      graphData.nodes.forEach((n) => {
        if (n.type === 'Claim' && n.metadata?.provider === provName) {
          timelineEvents.push({
            date: n.metadata?.date || new Date().toISOString(),
            title: 'Claim Created',
            desc: `Claim ${n.id} submitted for ${formatCurrency(n.metadata?.amount || 0)}.`,
            type: 'claim'
          })
        }
        if (n.type === 'Alert' && n.metadata?.provider === provName) {
          timelineEvents.push({
            date: n.metadata?.date || new Date().toISOString(),
            title: 'Alert Triggered',
            desc: `Risk prediction flagged alert ${n.id} (${n.metadata?.severity}).`,
            type: 'alert'
          })
        }
        if (n.type === 'Investigation' && n.metadata?.provider === provName) {
          timelineEvents.push({
            date: n.metadata?.date || new Date().toISOString(),
            title: 'Investigation Initiated',
            desc: `Case ${n.id} assigned to ${n.metadata?.assignedTo} under ${n.metadata?.priority} priority.`,
            type: 'case'
          })
        }
        if (n.type === 'Document' && n.metadata?.claimId) {
          // Verify if claim belongs to provider
          const cNode = graphData.nodes.find((cn) => cn.id === n.metadata.claimId)
          if (cNode && cNode.metadata?.provider === provName) {
            timelineEvents.push({
              date: n.metadata?.date || new Date().toISOString(),
              title: 'Document Verified',
              desc: `Document ${n.id} status marked ${n.metadata?.status} - ${n.metadata?.discrepancy}.`,
              type: 'document'
            })
          }
        }
      })

      return timelineEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }

    // Default timeline traversal for Claim
    if (nodeObj.type === 'Claim') {
      const timelineEvents = [
        {
          date: nodeObj.metadata?.date || new Date().toISOString(),
          title: 'Claim Submitted',
          desc: `Billing entry filed to provider ${nodeObj.metadata?.provider || 'Unknown'}.`,
          type: 'claim'
        }
      ]

      // Find alert
      const linkedAlert = graphData.nodes.find((n) => n.type === 'Alert' && n.metadata?.claimId === nodeObj.id)
      if (linkedAlert) {
        timelineEvents.push({
          date: linkedAlert.metadata?.date || new Date().toISOString(),
          title: 'Alert Generated',
          desc: `AI Prediction anomaly score flagged at ${linkedAlert.riskScore}%.`,
          type: 'alert'
        })

        // Find Case
        const linkedCase = graphData.nodes.find((n) => n.type === 'Investigation' && n.metadata?.alertId === linkedAlert.id)
        if (linkedCase) {
          timelineEvents.push({
            date: linkedCase.metadata?.date || new Date().toISOString(),
            title: 'Investigation Started',
            desc: `Case ${linkedCase.id} assigned to ${linkedCase.metadata?.assignedTo || 'Unassigned'}.`,
            type: 'case'
          })
        }
      }

      // Find Document
      const linkedDoc = graphData.nodes.find((n) => n.type === 'Document' && n.metadata?.claimId === nodeObj.id)
      if (linkedDoc) {
        timelineEvents.push({
          date: linkedDoc.metadata?.date || new Date().toISOString(),
          title: 'OCR Verified',
          desc: `Document metadata check status: ${linkedDoc.metadata?.status}.`,
          type: 'document'
        })
      }

      return timelineEvents
    }

    return []
  }, [selectedNodeId, graphData])

  // 7. Recharts Cluster Charts data
  const chartsData = useMemo(() => {
    // Breakdown count of nodes by type
    const counts = { Provider: 0, Claim: 0, Alert: 0, Investigation: 0, Document: 0 }
    graphData.nodes.forEach((n) => {
      if (counts[n.type] !== undefined) counts[n.type]++
    })

    const typeBreakdown = [
      { name: 'Providers', value: counts.Provider, color: '#6366f1' },
      { name: 'Claims', value: counts.Claim, color: '#0284c7' },
      { name: 'Alerts', value: counts.Alert, color: '#f59e0b' },
      { name: 'Cases', value: counts.Investigation, color: '#a855f7' },
      { name: 'Documents', value: counts.Document, color: '#0d9488' }
    ]

    // Cluster sizes bar data
    const clusterDistribution = suspiciousClusters.map((c) => ({
      name: c.providerName,
      'Cluster Size': c.entityCount,
      'Risk Score': c.riskScore
    }))

    // Risk ranges distribution
    const riskRanges = [
      { name: 'Critical (>=75)', value: graphData.nodes.filter((n) => n.riskScore >= 75).length, color: '#f43f5e' },
      { name: 'High (50-74)', value: graphData.nodes.filter((n) => n.riskScore >= 50 && n.riskScore < 75).length, color: '#f97316' },
      { name: 'Medium (25-49)', value: graphData.nodes.filter((n) => n.riskScore >= 25 && n.riskScore < 50).length, color: '#eab308' },
      { name: 'Low (<25)', value: graphData.nodes.filter((n) => n.riskScore < 25).length, color: '#10b981' }
    ]

    return {
      typeBreakdown,
      clusterDistribution,
      riskRanges
    }
  }, [graphData.nodes, suspiciousClusters])

  // 8. Annotation Actions
  const handleSaveNote = () => {
    if (!selectedNodeId) return
    addNetworkAnnotation(selectedNodeId, noteText)
  }

  const handleDeleteNote = () => {
    if (!selectedNodeId) return
    deleteNetworkAnnotation(selectedNodeId)
    setNoteText('')
  }

  // 9. Saved Views Actions
  const handleSaveCurrentView = () => {
    if (!newViewName) return

    const viewState = {
      id: `VIEW-${Date.now()}`,
      name: newViewName,
      description: newViewDesc,
      date: new Date().toISOString(),
      zoomScale,
      panX,
      panY,
      selectedNodeId,
      filters: {
        search,
        filterRiskLevel,
        filterType,
        filterStatus
      }
    }

    saveNetworkView(viewState)
    setNewViewName('')
    setNewViewDesc('')
    setSaveModalOpen(false)
  }

  const handleApplySavedView = (view) => {
    setZoomScale(view.zoomScale)
    setPanX(view.panX)
    setPanY(view.panY)
    setSelectedNodeId(view.selectedNodeId)
    
    if (view.filters) {
      setSearch(view.filters.search || '')
      setFilterRiskLevel(view.filters.filterRiskLevel || 'All')
      setFilterType(view.filters.filterType || 'All')
      setFilterStatus(view.filters.filterStatus || 'All')
    }
  }

  // 10. Exporters
  const handleExportCSV = () => {
    const headers = ['Entity ID', 'Entity Type', 'Risk Score', 'Label', 'Analyst Annotation', 'Provider Attribute', 'Amount Attribute', 'Discrepancies']
    const rows = graphData.nodes.map((n) => [
      `"${n.id}"`,
      `"${n.type}"`,
      n.riskScore,
      `"${n.label}"`,
      `"${networkAnnotations[n.id] || ''}"`,
      `"${n.metadata?.provider || ''}"`,
      n.metadata?.amount || '',
      `"${n.metadata?.discrepancy || ''}"`
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Fraud_Network_Entities_Export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 11. Canvas Interaction Handlers
  const handleZoom = (factor) => {
    setZoomScale((prev) => Math.min(3, Math.max(0.2, parseFloat((prev + factor).toFixed(2)))))
  }

  const handleResetZoom = () => {
    setZoomScale(0.85)
    setPanX(40)
    setPanY(20)
  }

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'circle' || e.target.tagName === 'text' || e.target.closest('.node-element')) {
      return // Don't pan when dragging nodes/text
    }
    setIsPanning(true)
    setPanStart({ x: e.clientX - panX, y: e.clientY - panY })
  }

  const handleMouseMove = (e) => {
    if (!isPanning) return
    setPanX(e.clientX - panStart.x)
    setPanY(e.clientY - panStart.y)
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  // 12. Reset All Filters
  const handleResetFilters = () => {
    setSearch('')
    setFilterRiskLevel('All')
    setFilterType('All')
    setFilterStatus('All')
    setSelectedNodeId(null)
  }

  const selectedNodeObj = useMemo(() => {
    return graphData.nodes.find((n) => n.id === selectedNodeId) || null
  }, [selectedNodeId, graphData.nodes])

  // Dynamic Skeletons for Loading State
  if (loading && graphData.nodes.length === 0) {
    return (
      <div className='space-y-6'>
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`kpi-skeleton-${idx}`}
              className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 shadow-xs'
            >
              <div className='flex items-center justify-between'>
                <Skeleton className='h-3.5 w-24' />
                <Skeleton className='h-8 w-8 rounded-xl' />
              </div>
              <Skeleton className='mt-4 h-8 w-16' />
              <Skeleton className='mt-2 h-3.5 w-44' />
            </div>
          ))}
        </div>
        <div className='grid gap-6 lg:grid-cols-3'>
          <div className='lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 h-96 flex items-center justify-center'>
            <div className='space-y-4 w-full px-12'>
              <Skeleton className='h-4 w-1/4 mx-auto' />
              <div className='relative h-60 border border-slate-100 dark:border-slate-900 rounded-xl flex items-center justify-center'>
                <div className='absolute inset-0 flex items-center justify-center opacity-30'>
                  <svg className='w-full h-full' viewBox='0 0 400 200'>
                    <circle cx='50' cy='100' r='10' fill='currentColor' />
                    <circle cx='150' cy='60' r='10' fill='currentColor' />
                    <circle cx='150' cy='140' r='10' fill='currentColor' />
                    <circle cx='250' cy='100' r='10' fill='currentColor' />
                    <line x1='50' y1='100' x2='150' y2='60' stroke='currentColor' strokeWidth='2' />
                    <line x1='50' y1='100' x2='150' y2='140' stroke='currentColor' strokeWidth='2' />
                    <line x1='150' y1='60' x2='250' y2='100' stroke='currentColor' strokeWidth='2' />
                    <line x1='150' y1='140' x2='250' y2='100' stroke='currentColor' strokeWidth='2' />
                  </svg>
                </div>
                <div className='text-xs font-semibold text-slate-450 dark:text-slate-500 z-10 animate-pulse'>
                  Simulating Relation Nodes...
                </div>
              </div>
            </div>
          </div>
          <div className='rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 h-96' />
        </div>
      </div>
    )
  }

  return (
    <section className='space-y-6 relative select-none'>
      {/* Print stylesheet */}
      <style>{`
        @media print {
          aside, nav, header, .no-print, button, select, input, .zoom-controls {
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
            border-radius: 12px !important;
            padding: 16px !important;
            margin-bottom: 16px !important;
            break-inside: avoid;
          }
        }
      `}</style>

      {/* Header Dashboard Banner */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-[linear-gradient(to_right,#f0fdf4,#f0f9ff,#ffffff)] p-5 shadow-xs dark:border-slate-800/90 dark:bg-[linear-gradient(to_right,rgba(16,185,129,0.1),rgba(14,165,233,0.12),rgba(2,6,23,0.7))] no-print'>
        <div>
          <p className='text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1.5'>
            <Network className='h-3.5 w-3.5 text-sky-500 animate-pulse' />
            Enterprise Fraud Linkage Intelligence
          </p>
          <h2 className='mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white'>
            Relationship Network Analysis Center
          </h2>
          <p className='mt-1 text-sm text-slate-650 dark:text-slate-350 max-w-4xl'>
            Audit interconnected fraud clusters, track high-risk billing entities, inspect dynamic visual linkages across claims, alerts, cases, and documents, and record persistent notes.
          </p>
        </div>

        <div className='flex flex-wrap gap-2 sm:self-center shrink-0'>
          <button
            type='button'
            onClick={() => window.print()}
            className='inline-flex items-center gap-1.5 rounded-xl border border-slate-250 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/90 transition shadow-xs'
          >
            <Printer className='h-3.5 w-3.5' /> Print PDF Report
          </button>
          <button
            type='button'
            onClick={handleExportCSV}
            className='inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-sky-700 transition shadow-xs'
          >
            <Download className='h-3.5 w-3.5' /> Export CSV List
          </button>
        </div>
      </div>

      {/* Overview KPIs */}
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4 no-print'>
        <motion.div
          whileHover={{ y: -2 }}
          className='relative overflow-hidden rounded-2xl border border-slate-200/85 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950/80'
        >
          <div className='absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-transparent -z-10' />
          <div className='flex items-center justify-between'>
            <p className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550'>Connected Entities</p>
            <div className='grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/10 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400'>
              <Layers className='h-4.5 w-4.5' />
            </div>
          </div>
          <p className='font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-3.5'>
            {graphData.nodes.length}
          </p>
          <p className='text-[10px] font-semibold text-slate-500 dark:text-slate-450 mt-2.5 flex items-center gap-1'>
            <span className='text-indigo-500 font-bold'>Active network nodes</span> mapped client-side
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className='relative overflow-hidden rounded-2xl border border-slate-200/85 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950/80'
        >
          <div className='absolute inset-0 bg-linear-to-br from-rose-500/5 via-transparent to-transparent -z-10' />
          <div className='flex items-center justify-between'>
            <p className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550'>Suspicious Clusters</p>
            <div className='grid h-9 w-9 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-950/40 dark:text-rose-450'>
              <AlertTriangle className='h-4.5 w-4.5' />
            </div>
          </div>
          <p className='font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-3.5'>
            {suspiciousClusters.filter((c) => c.riskScore >= 65).length}
          </p>
          <p className='text-[10px] font-semibold text-slate-500 dark:text-slate-450 mt-2.5 flex items-center gap-1'>
            <span className='text-rose-500 font-bold'>High risk groupings</span> detected
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className='relative overflow-hidden rounded-2xl border border-slate-200/85 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950/80'
        >
          <div className='absolute inset-0 bg-linear-to-br from-amber-500/5 via-transparent to-transparent -z-10' />
          <div className='flex items-center justify-between'>
            <p className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550'>High Risk Providers</p>
            <div className='grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-450'>
              <ShieldAlert className='h-4.5 w-4.5 animate-bounce' />
            </div>
          </div>
          <p className='font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-3.5'>
            {graphData.nodes.filter((n) => n.type === 'Provider' && n.riskScore >= 60).length}
          </p>
          <p className='text-[10px] font-semibold text-slate-500 dark:text-slate-450 mt-2.5 flex items-center gap-1'>
            <span className='text-amber-500 font-bold'>Risk rating &gt; 60%</span> billing providers
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className='relative overflow-hidden rounded-2xl border border-slate-200/85 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950/80'
        >
          <div className='absolute inset-0 bg-linear-to-br from-sky-500/5 via-transparent to-transparent -z-10' />
          <div className='flex items-center justify-between'>
            <p className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550'>Active Linkages</p>
            <div className='grid h-9 w-9 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-950/40 dark:text-sky-450'>
              <Share2 className='h-4.5 w-4.5' />
            </div>
          </div>
          <p className='font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-3.5'>
            {graphData.links.length}
          </p>
          <p className='text-[10px] font-semibold text-slate-500 dark:text-slate-450 mt-2.5 flex items-center gap-1'>
            <span className='text-sky-550 font-bold'>Relationship paths</span> established
          </p>
        </motion.div>
      </div>

      {/* Network Controls & Main Interface Layout */}
      <div className='grid gap-6 lg:grid-cols-3 no-print'>
        {/* Left Side: Filter, Saved views, Clusters */}
        <div className='space-y-6 lg:col-span-1'>
          
          {/* Composite Network Risk Scoring Panel */}
          <Card className='overflow-hidden relative bg-linear-to-tr from-slate-950 via-slate-900 to-indigo-950 text-white border-transparent shadow-md'>
            <div className='absolute right-2 bottom-2 text-white/5'>
              <Network className='h-36 w-36' />
            </div>
            <CardHeader className='pb-2'>
              <CardTitle className='text-xs font-bold uppercase tracking-wider text-indigo-300'>Composite Network Risk</CardTitle>
            </CardHeader>
            <CardContent className='pt-2'>
              <div className='flex items-center gap-5'>
                <div className='relative h-20 w-20 flex items-center justify-center rounded-full bg-slate-900/60 border-4 border-indigo-500/40 shadow-inner shrink-0'>
                  <div className='text-center'>
                    <span className='text-2xl font-bold block'>{networkRiskScoring.score}</span>
                    <span className='text-[8px] font-bold text-indigo-300 uppercase tracking-widest'>Score</span>
                  </div>
                </div>
                <div>
                  <div className='flex items-center gap-2'>
                    <span className='text-xs font-bold text-indigo-200 uppercase tracking-wider'>Status Band:</span>
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase',
                      networkRiskScoring.category === 'Critical' ? 'bg-rose-500 text-white' :
                      networkRiskScoring.category === 'High' ? 'bg-orange-500 text-white' :
                      networkRiskScoring.category === 'Medium' ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-white'
                    )}>
                      {networkRiskScoring.category}
                    </span>
                  </div>
                  <p className='text-[10px] text-indigo-200 mt-2 leading-relaxed'>
                    This composite score aggregates claim prediction scores, high-risk alert clusters, open investigations, and medical form discrepancies in the current network scope.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search & Filters */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-bold flex items-center gap-2'>
                <SlidersHorizontal className='h-4 w-4 text-sky-500' /> Filter Workspace
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='relative'>
                <Search className='absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500' />
                <input
                  type='text'
                  placeholder='Search Provider, Claim ID, Case...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs placeholder-slate-400 outline-hidden transition focus:border-sky-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200'
                />
                {search && (
                  <button onClick={() => setSearch('')} className='absolute right-3 top-3 text-slate-400 hover:text-slate-600'>
                    <X className='h-3.5 w-3.5' />
                  </button>
                )}
              </div>

              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <label className='text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1'>Entity Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className='w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs outline-hidden dark:border-slate-800 dark:bg-slate-900'
                  >
                    <option value='All'>All Types</option>
                    <option value='Provider'>Provider</option>
                    <option value='Claim'>Claim</option>
                    <option value='Alert'>Alert</option>
                    <option value='Investigation'>Investigation</option>
                    <option value='Document'>Document</option>
                  </select>
                </div>

                <div>
                  <label className='text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1'>Risk Range</label>
                  <select
                    value={filterRiskLevel}
                    onChange={(e) => setFilterRiskLevel(e.target.value)}
                    className='w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs outline-hidden dark:border-slate-800 dark:bg-slate-900'
                  >
                    <option value='All'>All Risk</option>
                    <option value='Critical'>Critical (&ge;75)</option>
                    <option value='High'>High (50-74)</option>
                    <option value='Medium'>Medium (25-49)</option>
                    <option value='Low'>Low (&lt;25)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className='text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1'>Status Attribute</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className='w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs outline-hidden dark:border-slate-800 dark:bg-slate-900'
                >
                  <option value='All'>All Statuses</option>
                  <option value='New'>New / Flagged</option>
                  <option value='Under Review'>Under Review</option>
                  <option value='Investigating'>Investigating</option>
                  <option value='Resolved'>Resolved / Verified</option>
                  <option value='Mismatch'>Mismatch Document</option>
                </select>
              </div>

              {(search || filterRiskLevel !== 'All' || filterType !== 'All' || filterStatus !== 'All') && (
                <button
                  type='button'
                  onClick={handleResetFilters}
                  className='w-full py-1.5 px-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-850 dark:hover:bg-slate-900 text-[11px] font-bold transition'
                >
                  Clear Active Filters
                </button>
              )}
            </CardContent>
          </Card>

          {/* Suspicious Cluster Detection List */}
          <Card className='max-h-76 flex flex-col justify-between overflow-hidden'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center justify-between'>
                <span>Suspicious Clusters index</span>
                <span className='text-[10px] font-normal text-slate-400 italic'>Grouped by Provider</span>
              </CardTitle>
            </CardHeader>
            <CardContent className='flex-1 overflow-y-auto pt-1 space-y-2 scrollbar-none'>
              {suspiciousClusters.length === 0 ? (
                <div className='text-center py-6 text-xs text-slate-400 italic'>No suspicious clusters found.</div>
              ) : (
                suspiciousClusters.map((cluster) => {
                  const isSelected = selectedNodeId === cluster.providerName
                  return (
                    <div
                      key={cluster.providerName}
                      onClick={() => setSelectedNodeId(cluster.providerName)}
                      className={cn(
                        'p-3 rounded-xl border transition cursor-pointer flex flex-col gap-2',
                        isSelected
                          ? 'bg-sky-500/10 border-sky-500 dark:bg-sky-950/30'
                          : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100 dark:bg-slate-900/40 dark:border-slate-900 dark:hover:bg-slate-900/80'
                      )}
                    >
                      <div className='flex items-center justify-between'>
                        <span className='text-xs font-bold text-slate-900 dark:text-slate-100'>{cluster.providerName} Cluster</span>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase',
                          cluster.priority === 'Immediate Audit' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-350' :
                          cluster.priority === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-350' : 'bg-slate-100 text-slate-700 dark:bg-slate-800'
                        )}>
                          {cluster.riskScore}% - {cluster.priority}
                        </span>
                      </div>

                      <div className='flex items-center justify-between text-[10px] text-slate-450 dark:text-slate-550 font-semibold'>
                        <div className='flex gap-2.5'>
                          <span>Claims: {cluster.breakdown.claims}</span>
                          <span>Alerts: {cluster.breakdown.alerts}</span>
                          <span>Cases: {cluster.breakdown.cases}</span>
                          <span>Docs: {cluster.breakdown.documents}</span>
                        </div>
                        <span className='text-sky-500 flex items-center gap-0.5'>
                          Inspect <ChevronRight className='h-3 w-3' />
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Saved views manager */}
          <Card>
            <CardHeader className='pb-2 flex flex-row items-center justify-between'>
              <CardTitle className='text-sm font-bold flex items-center gap-1.5'>
                <Bookmark className='h-4 w-4 text-amber-500' /> Saved Views
              </CardTitle>
              <button
                type='button'
                onClick={() => setSaveModalOpen(true)}
                className='p-1 rounded-lg bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 text-xs font-bold transition flex items-center gap-1'
              >
                <Plus className='h-3.5 w-3.5' /> Save Current
              </button>
            </CardHeader>
            <CardContent className='pt-1 space-y-2 max-h-48 overflow-y-auto scrollbar-none'>
              {savedNetworkViews.length === 0 ? (
                <div className='text-center py-4 text-xs text-slate-400 italic'>No saved views found.</div>
              ) : (
                savedNetworkViews.map((view) => (
                  <div
                    key={view.id}
                    className='p-2 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between text-xs font-semibold'
                  >
                    <div onClick={() => handleApplySavedView(view)} className='cursor-pointer flex-1 pr-2'>
                      <p className='text-slate-900 dark:text-slate-150 truncate'>{view.name}</p>
                      <p className='text-[9px] text-slate-400 font-medium truncate'>{view.description || 'No description'}</p>
                    </div>
                    <span className='text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5 mr-2 shrink-0'>
                      {new Date(view.date).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Zoomable SVG Relationship Graph Viewer */}
        <div className='lg:col-span-2 space-y-6'>
          <Card className='relative overflow-hidden group border-slate-200/80 dark:border-slate-800/80 shadow-xs'>
            
            {/* Zoom Overlay Controls */}
            <div className='absolute top-4 left-4 z-10 flex flex-col gap-1.5 bg-white/90 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-sm zoom-controls'>
              <button
                onClick={() => handleZoom(0.1)}
                className='p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-350 dark:hover:bg-slate-900 transition'
                title='Zoom In'
              >
                <ZoomIn className='h-4 w-4' />
              </button>
              <button
                onClick={() => handleZoom(-0.1)}
                className='p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-350 dark:hover:bg-slate-900 transition'
                title='Zoom Out'
              >
                <ZoomOut className='h-4 w-4' />
              </button>
              <button
                onClick={handleResetZoom}
                className='p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-350 dark:hover:bg-slate-900 transition border-t border-slate-100 dark:border-slate-900 mt-1 pt-1.5'
                title='Reset Zoom'
              >
                <RotateCcw className='h-4 w-4' />
              </button>
            </div>

            {/* Entity Columns Header Label Overlay */}
            <div className='absolute top-4 right-4 z-10 hidden sm:flex items-center gap-6 text-[9px] uppercase tracking-widest font-bold text-slate-400 bg-white/80 dark:bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-900/60 shadow-xs pointer-events-none'>
              <span className='text-indigo-500'>Provider</span>
              <span className='text-slate-300'>&rarr;</span>
              <span className='text-sky-500'>Claim</span>
              <span className='text-slate-300'>&rarr;</span>
              <span className='text-amber-500'>Alert</span>
              <span className='text-slate-300'>&rarr;</span>
              <span className='text-purple-500'>Case</span>
              <span className='text-slate-300'>&rarr;</span>
              <span className='text-teal-500'>Document</span>
            </div>

            {/* SVG Graph Canvas */}
            <div
              className={cn(
                'w-full bg-slate-50 dark:bg-slate-950/40 relative overflow-hidden transition-colors border-b border-slate-100 dark:border-slate-900',
                isPanning ? 'cursor-grabbing' : 'cursor-grab'
              )}
              style={{ height: '580px' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {layout.nodes.length === 0 ? (
                <div className='absolute inset-0 flex items-center justify-center'>
                  <EmptyState
                    title='No Connected Entities Found'
                    description='No relationships match your search query and filters. Reset the search criteria to view the full graph.'
                    actionLabel='Reset Graph Filters'
                    onAction={handleResetFilters}
                  />
                </div>
              ) : (
                <svg
                  ref={svgRef}
                  width='100%'
                  height='100%'
                  viewBox={`0 0 ${layout.width} ${layout.height}`}
                  preserveAspectRatio='xMidYMid meet'
                  className='w-full h-full'
                >
                  <defs>
                    <pattern id='blueprint' width='30' height='30' patternUnits='userSpaceOnUse'>
                      <path d='M 30 0 L 0 0 0 30' fill='none' stroke='currentColor' strokeWidth='0.5' className='text-slate-200/60 dark:text-slate-900/70' />
                    </pattern>
                  </defs>

                  {/* Canvas Grid Blueprint Background */}
                  <rect width='100%' height='100%' fill='url(#blueprint)' />

                  {/* Transformed Group for Zoom/Pan */}
                  <g transform={`translate(${panX}, ${panY}) scale(${zoomScale})`}>
                    
                    {/* Link paths */}
                    {layout.links.map((link, idx) => {
                      const sourceNode = link.sourceNode
                      const targetNode = link.targetNode

                      // Compute horizontal S-curve path
                      const x1 = sourceNode.x
                      const y1 = sourceNode.y
                      const x2 = targetNode.x
                      const y2 = targetNode.y
                      
                      const dx = x2 - x1
                      const path = `M ${x1} ${y1} C ${x1 + dx / 2} ${y1}, ${x2 - dx / 2} ${y2}, ${x2} ${y2}`

                      // Check if this link is part of the highlighted neighborhood
                      const isHighlighted = selectedNeighborhood 
                        ? selectedNeighborhood.nodes.has(sourceNode.id) && selectedNeighborhood.nodes.has(targetNode.id)
                        : false

                      const isDimmed = selectedNodeId && !isHighlighted

                      return (
                        <g key={`link-${idx}`}>
                          {/* Background thick highlight */}
                          <path
                            d={path}
                            fill='none'
                            stroke={isHighlighted ? '#38bdf8' : '#e2e8f0'}
                            strokeWidth={isHighlighted ? 4 : 1.5}
                            className={cn(
                              'transition-all duration-300',
                              isHighlighted ? 'opacity-80' : 'opacity-40',
                              isDimmed && 'opacity-10',
                              'dark:stroke-slate-800'
                            )}
                          />
                          {/* Pulsing light overlay on active links */}
                          {isHighlighted && (
                            <path
                              d={path}
                              fill='none'
                              stroke='#0ea5e9'
                              strokeWidth='3'
                              strokeDasharray='10, 15'
                              className='animate-[dash_2s_linear_infinite]'
                              style={{
                                animationName: 'dash',
                                animationDuration: '30s',
                                strokeLinecap: 'round'
                              }}
                            />
                          )}
                        </g>
                      )
                    })}

                    {/* Nodes */}
                    {layout.nodes.map((node) => {
                      const isSelected = selectedNodeId === node.id
                      const isHovered = hoveredNode === node.id
                      const isNeighborhood = selectedNeighborhood ? selectedNeighborhood.nodes.has(node.id) : false
                      const isDimmed = selectedNodeId && !isNeighborhood
                      
                      // Risk Ring border color
                      const riskBorderColor = getRiskColor(node.riskScore)

                      // Base type badge color mapping
                      const fillColors = {
                        Provider: 'bg-indigo-600',
                        Claim: 'bg-sky-600',
                        Alert: 'bg-amber-500',
                        Investigation: 'bg-purple-600',
                        Document: 'bg-teal-600'
                      }

                      // Dynamic alert severities
                      if (node.type === 'Alert') {
                        const sev = node.metadata?.severity
                        if (sev === 'Critical') fillColors.Alert = 'bg-rose-600'
                        else if (sev === 'High') fillColors.Alert = 'bg-orange-650'
                      }

                      // Check if node has local notes annotation
                      const hasAnnotation = !!networkAnnotations[node.id]

                      return (
                        <g
                          key={node.id}
                          transform={`translate(${node.x}, ${node.y})`}
                          className={cn(
                            'node-element cursor-pointer transition-all duration-300 origin-center',
                            isDimmed ? 'opacity-20 scale-90' : 'opacity-100 scale-100'
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedNodeId(node.id === selectedNodeId ? null : node.id)
                          }}
                          onMouseEnter={() => setHoveredNode(node.id)}
                          onMouseLeave={() => setHoveredNode(null)}
                        >
                          {/* Selection Glowing Ring */}
                          {isSelected && (
                            <circle
                              r='30'
                              fill='none'
                              stroke='#38bdf8'
                              strokeWidth='2.5'
                              strokeDasharray='5, 5'
                              className='animate-spin'
                              style={{ animationDuration: '12s' }}
                            />
                          )}

                          {/* Outer Risk Indicator Ring */}
                          <circle
                            r='24'
                            fill='#ffffff'
                            className='dark:fill-slate-900 transition-colors'
                            stroke={riskBorderColor}
                            strokeWidth='3.5'
                            style={{ filter: isHovered || isSelected ? `drop-shadow(0 0 8px ${riskBorderColor}80)` : 'none' }}
                          />

                          {/* Inner Circle Badge */}
                          <circle
                            r='18'
                            className={cn('transition-colors', fillColors[node.type] || 'bg-slate-500')}
                            fill='currentColor'
                          />

                          {/* SVG Icon representation inside badge */}
                          {node.type === 'Provider' && (
                            <path d='M-6,-4 L6,-4 L6,8 L-6,8 Z M0,-8 L0,0 M-4,-4 L4,-4' stroke='#fff' strokeWidth='1.5' fill='none' />
                          )}
                          {node.type === 'Claim' && (
                            <path d='M-5,-6 L2,-6 L6,-2 L6,7 L-5,7 Z M2,-6 L2,-2 L6,-2' stroke='#fff' strokeWidth='1.5' fill='none' />
                          )}
                          {node.type === 'Alert' && (
                            <path d='M0,-7 L6,4 L-6,4 Z M0,-3 L0,-1 M0,1 L0,1.5' stroke='#fff' strokeWidth='1.5' fill='none' strokeLinecap='round' />
                          )}
                          {node.type === 'Investigation' && (
                            <path d='M-5,-6 L5,-6 L5,6 L-5,6 Z M-2,-2 L2,-2 M-2,2 L2,2' stroke='#fff' strokeWidth='1.5' fill='none' />
                          )}
                          {node.type === 'Document' && (
                            <path d='M-4,-7 L4,-7 L4,7 L-4,7 Z M-2,-3 L2,-3 M-2,1 L2,1' stroke='#fff' strokeWidth='1.2' fill='none' />
                          )}

                          {/* Annotation Pin Indicator */}
                          {hasAnnotation && (
                            <g transform='translate(16, -16)'>
                              <circle r='6' fill='#facc15' className='animate-pulse' />
                              <circle r='4' fill='#eab308' />
                            </g>
                          )}

                          {/* Node Label Text */}
                          <text
                            y='38'
                            textAnchor='middle'
                            className='text-[10px] font-bold fill-slate-800 dark:fill-slate-200 transition-all select-none'
                            style={{
                              textShadow: '0 1px 2px rgba(255,255,255,0.9)',
                              filter: 'drop-shadow(0px 1px 1px rgba(255, 255, 255, 0.9))'
                            }}
                          >
                            {node.label}
                          </text>

                          {/* Risk percentage label badge */}
                          <text
                            y='-32'
                            textAnchor='middle'
                            className='text-[8px] font-bold fill-slate-400 dark:fill-slate-550'
                          >
                            {node.riskScore}% Risk
                          </text>
                        </g>
                      )
                    })}
                  </g>
                </svg>
              )}
            </div>

            {/* Hover Node detail tooltips footer panel */}
            <div className='p-3 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xs flex items-center justify-between text-xs font-semibold px-5 no-print'>
              <div className='flex items-center gap-2 text-slate-500'>
                <Info className='h-4 w-4 text-sky-550' />
                <span>Hover a node to inspect relationships, click a node to highlight its neighborhood and configure notes.</span>
              </div>
              <div>
                {hoveredNode && (
                  <span className='animate-pulse text-sky-600 dark:text-sky-400 font-bold'>
                    Active Hover: {hoveredNode}
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Cluster Distribution Analytics Charts */}
          <div className='grid gap-6 md:grid-cols-2 no-print'>
            
            {/* Chart 1: Cluster Size Distribution */}
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550'>
                  Cluster Size distribution
                </CardTitle>
              </CardHeader>
              <CardContent className='h-64 pt-2'>
                {chartsData.clusterDistribution.length === 0 ? (
                  <div className='h-full flex items-center justify-center text-xs text-slate-400 italic'>No cluster size data available</div>
                ) : (
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={chartsData.clusterDistribution}>
                      <XAxis dataKey='name' tick={{ fontSize: 9 }} stroke='#64748b' />
                      <YAxis tick={{ fontSize: 9 }} stroke='#64748b' />
                      <ChartTooltip
                        contentStyle={{
                          fontSize: '11px',
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar dataKey='Cluster Size' fill='#6366f1' radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Chart 2: Entity Types Breakdown */}
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550'>
                  Entity type distribution
                </CardTitle>
              </CardHeader>
              <CardContent className='h-64 pt-2'>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={chartsData.typeBreakdown}
                      cx='50%'
                      cy='50%'
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey='value'
                    >
                      {chartsData.typeBreakdown.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign='bottom'
                      height={36}
                      tick={{ fontSize: 9 }}
                      iconType='circle'
                    />
                    <ChartTooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Network Details & Note Editor Drawer Overlay */}
      <AnimatePresence>
        {selectedNodeObj && (
          <div className='fixed inset-0 z-50 overflow-hidden no-print'>
            {/* Slide-over backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNodeId(null)}
              className='absolute inset-0 bg-slate-950/60 backdrop-blur-xs'
            />

            <div className='absolute inset-y-0 right-0 flex max-w-full pl-10'>
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
                className='w-screen max-w-md bg-white shadow-2xl dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between h-full'
              >
                {/* Drawer Header */}
                <div className='border-b border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800/80 dark:bg-slate-900/40 flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='grid h-9 w-9 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400'>
                      <Network className='h-4.5 w-4.5 animate-pulse' />
                    </div>
                    <div>
                      <h3 className='font-display text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-56'>
                        {selectedNodeObj.label}
                      </h3>
                      <p className='text-xs text-slate-400 font-semibold mt-0.5'>{selectedNodeObj.type} Entity details</p>
                    </div>
                  </div>
                  <button
                    type='button'
                    onClick={() => setSelectedNodeId(null)}
                    className='grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-550 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                  >
                    <X className='h-4 w-4' />
                  </button>
                </div>

                {/* Drawer Content */}
                <div className='flex-1 overflow-y-auto p-5 space-y-6 scrollbar-none'>
                  
                  {/* Risk gauge card */}
                  <div className='flex items-center gap-4 bg-slate-50/60 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-900'>
                    <div className='relative h-18 w-18 flex items-center justify-center shrink-0'>
                      <svg className='w-full h-full transform -rotate-90' viewBox='0 0 100 100'>
                        <circle cx='50' cy='50' r='42' stroke='#cbd5e1' className='dark:stroke-slate-800' strokeWidth='8' fill='transparent' />
                        <circle
                          cx='50'
                          cy='50'
                          r='42'
                          stroke={getRiskColor(selectedNodeObj.riskScore)}
                          strokeWidth='8'
                          fill='transparent'
                          strokeDasharray={263.8}
                          strokeDashoffset={263.8 - (263.8 * selectedNodeObj.riskScore) / 100}
                          strokeLinecap='round'
                        />
                      </svg>
                      <div className='absolute flex flex-col items-center justify-center text-center'>
                        <span className='font-display text-lg font-bold text-slate-900 dark:text-white'>
                          {selectedNodeObj.riskScore}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className='text-xs font-bold text-slate-400 uppercase tracking-wide'>Risk level band</p>
                      <div className='mt-1 flex items-center gap-2'>
                        {getRiskBadge(selectedNodeObj.riskScore)}
                        <span className='text-[10px] text-slate-500 font-semibold'>Score Index</span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Metadata Attributes based on Entity Type */}
                  <div className='space-y-3'>
                    <h4 className='text-[10px] font-bold text-slate-400 uppercase tracking-wider block'>Entity Attributes</h4>
                    <div className='rounded-xl border border-slate-100 bg-slate-50/30 p-3.5 dark:border-slate-900 dark:bg-slate-900/10 space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-350'>
                      {selectedNodeObj.type === 'Provider' && (
                        <>
                          <div className='flex justify-between'><span className='text-slate-400'>Total claims:</span><span>{selectedNodeObj.metadata?.claimsCount || 0}</span></div>
                          <div className='flex justify-between'><span className='text-slate-400'>Billed amount:</span><span>{formatCurrency(selectedNodeObj.metadata?.totalClaimAmount || 0)}</span></div>
                          <div className='flex justify-between'><span className='text-slate-400'>Fraud classification:</span><span className='text-rose-500'>{selectedNodeObj.metadata?.fraudCount || 0} claims</span></div>
                          {selectedNodeObj.metadata?.watchlist && (
                            <div className='flex justify-between'><span className='text-slate-400'>Watchlist status:</span><span className='text-amber-500 font-bold'>Active Flagged</span></div>
                          )}
                        </>
                      )}

                      {selectedNodeObj.type === 'Claim' && (
                        <>
                          <div className='flex justify-between'><span className='text-slate-400'>Claim amount:</span><span>{formatCurrency(selectedNodeObj.metadata?.amount || 0)}</span></div>
                          <div className='flex justify-between'><span className='text-slate-400'>Billing provider:</span><span className='text-sky-550'>{selectedNodeObj.metadata?.provider || 'Unknown'}</span></div>
                          <div className='flex justify-between'><span className='text-slate-400'>Procedures billed:</span><span>{selectedNodeObj.metadata?.procedures || 1} codes</span></div>
                          <div className='flex justify-between'><span className='text-slate-400'>Status classification:</span><span>{selectedNodeObj.metadata?.status || 'Pending'}</span></div>
                        </>
                      )}

                      {selectedNodeObj.type === 'Alert' && (
                        <>
                          <div className='flex justify-between'><span className='text-slate-400'>Severity level:</span><span>{selectedNodeObj.metadata?.severity || 'Medium'}</span></div>
                          <div className='flex justify-between'><span className='text-slate-400'>Associated claim:</span><span className='text-sky-550'>{selectedNodeObj.metadata?.claimId || 'Unknown'}</span></div>
                          <div className='flex justify-between'><span className='text-slate-400'>Billing provider:</span><span>{selectedNodeObj.metadata?.provider || 'Unknown'}</span></div>
                          <div className='flex justify-between'><span className='text-slate-400'>Investigation review:</span><span>{selectedNodeObj.metadata?.status || 'New'}</span></div>
                        </>
                      )}

                      {selectedNodeObj.type === 'Investigation' && (
                        <>
                          <div className='flex justify-between'><span className='text-slate-400'>Case status:</span><span>{selectedNodeObj.metadata?.status || 'New'}</span></div>
                          <div className='flex justify-between'><span className='text-slate-400'>Escalation priority:</span><span className='text-rose-500'>{selectedNodeObj.metadata?.priority || 'Medium'}</span></div>
                          <div className='flex justify-between'><span className='text-slate-400'>Assigned investigator:</span><span>{selectedNodeObj.metadata?.assignedTo || 'Unassigned'}</span></div>
                          <div className='flex justify-between'><span className='text-slate-400'>Source alert ID:</span><span>{selectedNodeObj.metadata?.alertId || 'None'}</span></div>
                        </>
                      )}

                      {selectedNodeObj.type === 'Document' && (
                        <>
                          <div className='flex justify-between'><span className='text-slate-400'>Form status:</span><span>{selectedNodeObj.metadata?.status || 'Pending'}</span></div>
                          <div className='flex justify-between'><span className='text-slate-400'>Form classification:</span><span>{selectedNodeObj.metadata?.type || 'Record'}</span></div>
                          <div className='flex justify-between'><span className='text-slate-400'>Verification check:</span><span className={selectedNodeObj.metadata?.status === 'Mismatch' ? 'text-rose-500' : 'text-emerald-500'}>{selectedNodeObj.metadata?.discrepancy || 'None'}</span></div>
                          <div className='flex justify-between'><span className='text-slate-400'>Target claim:</span><span className='text-sky-550'>{selectedNodeObj.metadata?.claimId || 'None'}</span></div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Traversal Timeline (Only for Provider or Claims) */}
                  {selectedTimeline.length > 0 && (
                    <div className='space-y-4'>
                      <h4 className='text-[10px] font-bold text-slate-400 uppercase tracking-wider block'>Traverse Entity Timeline</h4>
                      <div className='relative pl-4 space-y-4 border-l border-slate-200 dark:border-slate-800 ml-1.5'>
                        {selectedTimeline.map((item, idx) => (
                          <div key={idx} className='relative text-xs'>
                            <div className={cn(
                              'absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white dark:border-slate-950',
                              item.type === 'claim' ? 'bg-sky-500' :
                              item.type === 'alert' ? 'bg-amber-500' :
                              item.type === 'case' ? 'bg-purple-500' : 'bg-teal-500'
                            )} />
                            <div className='flex justify-between font-bold text-slate-800 dark:text-slate-200'>
                              <span>{item.title}</span>
                              <span className='text-[8px] font-normal text-slate-400'>{new Date(item.date).toLocaleDateString()}</span>
                            </div>
                            <p className='text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5'>{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Annotation Note Editor System */}
                  <div className='border-t border-slate-100 dark:border-slate-900 pt-5 space-y-3'>
                    <label htmlFor='notes-text' className='text-[10px] font-bold text-slate-400 uppercase tracking-wider block'>
                      Analyst annotation log
                    </label>
                    <textarea
                      id='notes-text'
                      rows={3}
                      placeholder='Record suspicious pattern findings, upcoding behavior, or manual audit results...'
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className='w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs outline-hidden placeholder:text-slate-400 focus:border-sky-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-250'
                    />
                    <div className='flex justify-end gap-2'>
                      {networkAnnotations[selectedNodeObj.id] && (
                        <button
                          type='button'
                          onClick={handleDeleteNote}
                          className='p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg text-xs font-bold transition flex items-center gap-1'
                        >
                          <Trash2 className='h-3.5 w-3.5' /> Delete Note
                        </button>
                      )}
                      <button
                        type='button'
                        onClick={handleSaveNote}
                        className='py-1.5 px-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 text-xs font-bold transition flex items-center gap-1'
                      >
                        <Save className='h-3.5 w-3.5' /> Save Annotation
                      </button>
                    </div>
                  </div>

                </div>

                {/* Drawer Footer close trigger */}
                <div className='border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-900/40 flex justify-end gap-2'>
                  <button
                    type='button'
                    onClick={() => setSelectedNodeId(null)}
                    className='py-2 px-4 text-xs font-bold bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition shadow-xs'
                  >
                    Close Drawer
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Save View Modal Dialog */}
      <AnimatePresence>
        {saveModalOpen && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 no-print'>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSaveModalOpen(false)}
              className='fixed inset-0 bg-slate-950/60 backdrop-blur-xs'
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className='relative bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 shadow-2xl max-w-sm w-full space-y-4'
            >
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5'>
                  <Bookmark className='h-4.5 w-4.5 text-amber-500' /> Save Investigation View
                </h3>
                <button
                  type='button'
                  onClick={() => setSaveModalOpen(false)}
                  className='p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>

              <div className='space-y-3 text-xs'>
                <div>
                  <label className='block font-bold text-slate-450 uppercase mb-1'>View Title Name</label>
                  <input
                    type='text'
                    placeholder='e.g., Provider B Mismatches Audit'
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    className='w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 outline-hidden focus:border-sky-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900'
                  />
                </div>
                <div>
                  <label className='block font-bold text-slate-450 uppercase mb-1'>Audit Description</label>
                  <textarea
                    rows={2}
                    placeholder='Add context notes describing this saved investigation sub-state...'
                    value={newViewDesc}
                    onChange={(e) => setNewViewDesc(e.target.value)}
                    className='w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 outline-hidden focus:border-sky-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900'
                  />
                </div>
              </div>

              <div className='flex justify-end gap-2 pt-2'>
                <button
                  type='button'
                  onClick={() => setSaveModalOpen(false)}
                  className='py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 dark:border-slate-850 dark:hover:bg-slate-900 dark:text-slate-450 transition'
                >
                  Cancel
                </button>
                <button
                  type='button'
                  onClick={handleSaveCurrentView}
                  disabled={!newViewName}
                  className='py-2 px-4 rounded-xl bg-sky-650 text-white hover:bg-sky-700 text-xs font-bold transition disabled:opacity-50'
                >
                  Save View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Print Area specifically structured for printable reports */}
      <div className='hidden print-area space-y-6'>
        <div className='border-b-2 border-slate-300 pb-4'>
          <h1 className='text-2xl font-bold'>Healthcare AI Platform - Fraud Network Analysis Report</h1>
          <p className='text-xs text-slate-500 mt-1'>Report generated on: {new Date().toLocaleString()}</p>
        </div>

        <div className='print-card border border-slate-200 p-4 rounded-xl'>
          <h3 className='text-sm font-bold uppercase text-slate-500'>Platform Aggregate Risk Indicators</h3>
          <div className='grid grid-cols-4 gap-4 mt-3 text-xs'>
            <div><strong>Composite Risk Score:</strong> {networkRiskScoring.score}% ({networkRiskScoring.category})</div>
            <div><strong>Mapped Entities:</strong> {graphData.nodes.length} nodes</div>
            <div><strong>High-Risk Groups:</strong> {suspiciousClusters.filter((c) => c.riskScore >= 65).length} detected</div>
            <div><strong>Active Traversal Links:</strong> {graphData.links.length} lines</div>
          </div>
        </div>

        <div className='print-card border border-slate-200 p-4 rounded-xl'>
          <h3 className='text-sm font-bold uppercase text-slate-500 mb-3'>Detected Suspicious Clusters Index</h3>
          <table className='w-full text-xs text-left border-collapse'>
            <thead>
              <tr className='border-b border-slate-350'>
                <th className='py-2'>Provider / Cluster ID</th>
                <th className='py-2'>Cluster Risk Rating</th>
                <th className='py-2'>Audit Status Level</th>
                <th className='py-2 text-right'>Linked Nodes count</th>
              </tr>
            </thead>
            <tbody>
              {suspiciousClusters.map((c) => (
                <tr key={c.providerName} className='border-b border-slate-200'>
                  <td className='py-2 font-bold'>{c.providerName}</td>
                  <td className='py-2'>{c.riskScore}%</td>
                  <td className='py-2'>{c.priority}</td>
                  <td className='py-2 text-right'>{c.entityCount} entities</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='print-card border border-slate-200 p-4 rounded-xl'>
          <h3 className='text-sm font-bold uppercase text-slate-500 mb-3'>Analyst Network Annotation Notes</h3>
          {Object.keys(networkAnnotations).length === 0 ? (
            <p className='text-xs text-slate-400 italic'>No annotation logs recorded on active nodes.</p>
          ) : (
            <table className='w-full text-xs text-left border-collapse'>
              <thead>
                <tr className='border-b border-slate-350'>
                  <th className='py-2 w-1/4'>Target Node</th>
                  <th className='py-2'>Analyst Annotation Log Notes</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(networkAnnotations).map(([nodeId, note]) => (
                  <tr key={nodeId} className='border-b border-slate-200 align-top'>
                    <td className='py-2 font-bold'>{nodeId}</td>
                    <td className='py-2 whitespace-pre-wrap leading-relaxed'>{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  )
}
