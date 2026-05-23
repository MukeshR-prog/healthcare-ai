import { useEffect, useMemo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
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
  FileSearch,
  ScanLine,
  UploadCloud,
  FilePlus2,
  Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useStore } from '@/store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency, formatPercent } from '@/utils/format'
import { cn } from '@/utils/cn'

// Helpers
const getStatusBadge = (status) => {
  if (status === 'Verified') return <span className='inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'><CheckCircle className='h-3 w-3' /> Verified</span>
  if (status === 'Warning') return <span className='inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-950/20 dark:text-amber-450'><AlertTriangle className='h-3 w-3' /> Warning</span>
  return <span className='inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'><ShieldAlert className='h-3 w-3' /> Mismatch</span>
}

const getRiskBadge = (risk) => {
  if (risk === 'High') return <span className='inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'>High</span>
  if (risk === 'Medium') return <span className='inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'>Medium</span>
  return <span className='inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-350'>Low</span>
}

// Generate base mock document profiles if store is empty
const generateMockDocuments = () => {
  return [
    {
      id: 'DOC-401',
      fileName: 'medical_invoice_johnathan.pdf',
      fileSize: '342 KB',
      fileType: 'application/pdf',
      status: 'Warning',
      riskLevel: 'Medium',
      patientName: 'Johnathan Doe',
      providerName: 'Provider B',
      claimAmount: 14200,
      dateOfService: '2026-05-10',
      diagnosisCode: 'K52.9',
      procedureCode: '99214',
      created_at: new Date(2026, 4, 18, 10, 30).toISOString(),
      notes: [
        { text: 'Extracted patient name matches Jonathan Doe with slight character deviation. Discrepancy warning raised.', date: new Date(2026, 4, 18, 10, 45).toISOString(), analyst: 'System' }
      ]
    },
    {
      id: 'DOC-402',
      fileName: 'billing_statement_sarah_connor.jpg',
      fileSize: '1.2 MB',
      fileType: 'image/jpeg',
      status: 'Mismatch',
      riskLevel: 'High',
      patientName: 'Sarah Connor',
      providerName: 'Provider C',
      claimAmount: 21600,
      dateOfService: '2026-05-12',
      diagnosisCode: 'M54.5',
      procedureCode: '99215',
      created_at: new Date(2026, 4, 19, 14, 20).toISOString(),
      notes: [
        { text: 'Invoice document claim amount list is $18,200. Claim submission lists $21,600. Major mismatch flag raised.', date: new Date(2026, 4, 19, 14, 30).toISOString(), analyst: 'System' }
      ]
    },
    {
      id: 'DOC-403',
      fileName: 'claim_invoice_alex_mercer.png',
      fileSize: '890 KB',
      fileType: 'image/png',
      status: 'Verified',
      riskLevel: 'Low',
      patientName: 'Alex Mercer',
      providerName: 'Provider A',
      claimAmount: 4833,
      dateOfService: '2026-05-14',
      diagnosisCode: 'J06.9',
      procedureCode: '99213',
      created_at: new Date(2026, 4, 20, 11, 15).toISOString(),
      notes: [
        { text: 'All extracted values match claim registry fields successfully.', date: new Date(2026, 4, 20, 11, 20).toISOString(), analyst: 'System' }
      ]
    },
    {
      id: 'DOC-404',
      fileName: 'medical_statement_jane_smith.pdf',
      fileSize: '210 KB',
      fileType: 'application/pdf',
      status: 'Verified',
      riskLevel: 'Low',
      patientName: 'Jane Smith',
      providerName: 'Provider D',
      claimAmount: 4133,
      dateOfService: '2026-05-15',
      created_at: new Date(2026, 4, 21, 16, 40).toISOString(),
      notes: []
    }
  ]
}

const generateMockResults = () => {
  return [
    {
      docId: 'DOC-401',
      score: 75,
      trustRating: 'Good',
      mismatchCount: 1,
      checks: {
        nameMatch: 'warning', // Johnathan vs Jonathan
        providerMatch: 'verified',
        amountMatch: 'verified',
        dateMatch: 'verified'
      },
      claimValues: {
        patientName: 'Jonathan Doe',
        providerName: 'Provider B',
        claimAmount: 14200,
        dateOfService: '2026-05-10'
      }
    },
    {
      docId: 'DOC-402',
      score: 40,
      trustRating: 'Suspicious',
      mismatchCount: 1,
      checks: {
        nameMatch: 'verified',
        providerMatch: 'verified',
        amountMatch: 'mismatch', // $18,200 vs $21,600
        dateMatch: 'verified'
      },
      claimValues: {
        patientName: 'Sarah Connor',
        providerName: 'Provider C',
        claimAmount: 21600,
        dateOfService: '2026-05-12'
      }
    },
    {
      docId: 'DOC-403',
      score: 100,
      trustRating: 'Excellent',
      mismatchCount: 0,
      checks: {
        nameMatch: 'verified',
        providerMatch: 'verified',
        amountMatch: 'verified',
        dateMatch: 'verified'
      },
      claimValues: {
        patientName: 'Alex Mercer',
        providerName: 'Provider A',
        claimAmount: 4833,
        dateOfService: '2026-05-14'
      }
    },
    {
      docId: 'DOC-404',
      score: 100,
      trustRating: 'Excellent',
      mismatchCount: 0,
      checks: {
        nameMatch: 'verified',
        providerMatch: 'verified',
        amountMatch: 'verified',
        dateMatch: 'verified'
      },
      claimValues: {
        patientName: 'Jane Smith',
        providerName: 'Provider D',
        claimAmount: 4133,
        dateOfService: '2026-05-15'
      }
    }
  ]
}

// Slide-Over Verification Details Drawer
function DocumentDrawer({ docItem, resultItem, onClose, onAddNote, onDelete }) {
  const [noteText, setNoteText] = useState('')
  const [currentAnalyst, setCurrentAnalyst] = useState('John Doe')

  const analysts = ['John Doe', 'Sarah Connor', 'Alex Mercer', 'Jane Smith']

  if (!docItem || !resultItem) return null

  const handlePostNote = (e) => {
    e.preventDefault()
    if (!noteText.trim()) return
    onAddNote(docItem.id, noteText, currentAnalyst)
    setNoteText('')
    toast.success('Analyst note saved.')
  }

  const handleDeleteDoc = () => {
    if (window.confirm('Are you sure you want to delete this document from the center?')) {
      onDelete(docItem.id)
      onClose()
      toast.success('Document deleted.')
    }
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
            <div className='flex items-center gap-3'>
              <div className='grid h-10 w-10 place-items-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-950/40 border border-sky-500/20'>
                <FileSearch className='h-5 w-5' />
              </div>
              <div>
                <h3 className='font-display text-base font-bold text-slate-900 dark:text-slate-100'>
                  Verification Audit Details
                </h3>
                <p className='text-xs text-slate-400 font-semibold mt-0.5'>{docItem.id}</p>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={handleDeleteDoc}
                className='grid h-9 w-9 place-items-center rounded-xl border border-rose-250 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-955/20 dark:border-rose-900 dark:text-rose-400'
                title='Delete Document'
              >
                <Trash2 className='h-4 w-4' />
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
            
            {/* Verification Score Card */}
            <div className='grid grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-900'>
              <div className='space-y-1'>
                <span className='text-[9px] font-bold text-slate-400 uppercase tracking-wider block'>Document Trust Index</span>
                <span className='font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white'>
                  {resultItem.score}%
                </span>
                <span className='block text-[10px] text-slate-400 font-semibold mt-1'>
                  Rating: <strong>{resultItem.trustRating}</strong>
                </span>
              </div>

              <div className='space-y-2.5 pl-4 border-l border-slate-200 dark:border-slate-800'>
                <div className='flex justify-between items-center text-xs'>
                  <span className='text-slate-400 font-bold uppercase text-[9px]'>Status:</span>
                  {getStatusBadge(docItem.status)}
                </div>
                <div className='flex justify-between items-center text-xs'>
                  <span className='text-slate-400 font-bold uppercase text-[9px]'>Risk level:</span>
                  {getRiskBadge(docItem.riskLevel)}
                </div>
                <div className='flex justify-between items-center text-xs'>
                  <span className='text-slate-400 font-bold uppercase text-[9px]'>Mismatches:</span>
                  <span className='font-bold text-rose-500'>{resultItem.mismatchCount}</span>
                </div>
              </div>
            </div>

            {/* Document Preview Rendering Simulation */}
            <div className='rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/10 space-y-2'>
              <div className='flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase tracking-wider'>
                <span>Uploaded Document Visual Preview</span>
                <span className='text-[8px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded-lg font-bold'>{docItem.fileSize}</span>
              </div>
              <div className='border border-dashed border-slate-250 bg-white p-4 rounded-xl dark:border-slate-800 dark:bg-slate-950 flex flex-col justify-between min-h-32 text-slate-800 dark:text-slate-200 font-mono text-[10px] space-y-2'>
                <div className='flex justify-between border-b border-slate-100 pb-2 dark:border-slate-900'>
                  <div>
                    <h5 className='font-bold text-xs uppercase tracking-tight text-slate-900 dark:text-white'>INVOICE BILLING STATEMENT</h5>
                    <p className='text-[8px] text-slate-400 font-semibold'>Date: {docItem.dateOfService || '-'}</p>
                  </div>
                  <span className='text-right text-[8px] font-bold text-slate-400'>FILE: {docItem.fileName}</span>
                </div>
                
                <div className='space-y-1'>
                  <p>PATIENT NAME: {docItem.patientName || 'UNREADABLE'}</p>
                  <p>BILLING PROVIDER: {docItem.providerName || 'UNREADABLE'}</p>
                  {docItem.diagnosisCode && <p>DIAGNOSIS CODE: {docItem.diagnosisCode}</p>}
                  {docItem.procedureCode && <p>PROCEDURE CODE: {docItem.procedureCode}</p>}
                </div>
                
                <div className='flex justify-between border-t border-slate-100 pt-2 dark:border-slate-900 text-slate-950 dark:text-white font-bold text-xs'>
                  <span>INVOICE TOTAL:</span>
                  <span>{formatCurrency(docItem.claimAmount)}</span>
                </div>
              </div>
            </div>

            {/* Side-by-Side OCR Verification Engine Results */}
            <div className='border-t border-slate-100 pt-5 dark:border-slate-800/80 space-y-3.5'>
              <h4 className='text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500'>OCR Extraction vs Claim Submission Values</h4>
              
              <div className='space-y-2.5 text-xs font-semibold'>
                
                {/* Patient Name check */}
                <div className='p-3 bg-slate-50/50 border border-slate-100 rounded-xl dark:bg-slate-900/20 dark:border-slate-900 flex justify-between items-center gap-4'>
                  <div className='space-y-1 flex-1'>
                    <span className='text-[9px] font-bold text-slate-400 uppercase block'>Patient Name Check</span>
                    <div className='grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300'>
                      <div>
                        <span className='text-[8px] text-slate-450 block font-bold'>Extracted Document</span>
                        {docItem.patientName}
                      </div>
                      <div>
                        <span className='text-[8px] text-slate-450 block font-bold'>Claim Submission</span>
                        {resultItem.claimValues.patientName}
                      </div>
                    </div>
                  </div>
                  <div className='shrink-0'>
                    {resultItem.checks.nameMatch === 'verified' ? (
                      <span className='text-emerald-500 text-xs font-bold'>Verified</span>
                    ) : resultItem.checks.nameMatch === 'warning' ? (
                      <span className='text-amber-500 text-xs font-bold' title='Slight spelling mismatch'>Warning</span>
                    ) : (
                      <span className='text-rose-500 text-xs font-bold'>Mismatch</span>
                    )}
                  </div>
                </div>

                {/* Billing Provider check */}
                <div className='p-3 bg-slate-50/50 border border-slate-100 rounded-xl dark:bg-slate-900/20 dark:border-slate-900 flex justify-between items-center gap-4'>
                  <div className='space-y-1 flex-1'>
                    <span className='text-[9px] font-bold text-slate-400 uppercase block'>Billing Provider Check</span>
                    <div className='grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300'>
                      <div>
                        <span className='text-[8px] text-slate-450 block font-bold'>Extracted Document</span>
                        {docItem.providerName}
                      </div>
                      <div>
                        <span className='text-[8px] text-slate-450 block font-bold'>Claim Submission</span>
                        {resultItem.claimValues.providerName}
                      </div>
                    </div>
                  </div>
                  <div className='shrink-0'>
                    {resultItem.checks.providerMatch === 'verified' ? (
                      <span className='text-emerald-500 text-xs font-bold'>Verified</span>
                    ) : (
                      <span className='text-rose-500 text-xs font-bold'>Mismatch</span>
                    )}
                  </div>
                </div>

                {/* Claim Amount check */}
                <div className='p-3 bg-slate-50/50 border border-slate-100 rounded-xl dark:bg-slate-900/20 dark:border-slate-900 flex justify-between items-center gap-4'>
                  <div className='space-y-1 flex-1'>
                    <span className='text-[9px] font-bold text-slate-400 uppercase block'>Claim Amount Check</span>
                    <div className='grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300'>
                      <div>
                        <span className='text-[8px] text-slate-450 block font-bold'>Extracted Document</span>
                        {formatCurrency(docItem.claimAmount)}
                      </div>
                      <div>
                        <span className='text-[8px] text-slate-450 block font-bold'>Claim Submission</span>
                        {formatCurrency(resultItem.claimValues.claimAmount)}
                      </div>
                    </div>
                  </div>
                  <div className='shrink-0'>
                    {resultItem.checks.amountMatch === 'verified' ? (
                      <span className='text-emerald-500 text-xs font-bold'>Verified</span>
                    ) : (
                      <span className='text-rose-500 text-xs font-bold'>Mismatch</span>
                    )}
                  </div>
                </div>

                {/* Date of Service check */}
                <div className='p-3 bg-slate-50/50 border border-slate-100 rounded-xl dark:bg-slate-900/20 dark:border-slate-900 flex justify-between items-center gap-4'>
                  <div className='space-y-1 flex-1'>
                    <span className='text-[9px] font-bold text-slate-400 uppercase block'>Date of Service Check</span>
                    <div className='grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300'>
                      <div>
                        <span className='text-[8px] text-slate-450 block font-bold'>Extracted Document</span>
                        {docItem.dateOfService ? new Date(docItem.dateOfService).toLocaleDateString() : '-'}
                      </div>
                      <div>
                        <span className='text-[8px] text-slate-450 block font-bold'>Claim Submission</span>
                        {resultItem.claimValues.dateOfService ? new Date(resultItem.claimValues.dateOfService).toLocaleDateString() : '-'}
                      </div>
                    </div>
                  </div>
                  <div className='shrink-0'>
                    {resultItem.checks.dateMatch === 'verified' ? (
                      <span className='text-emerald-500 text-xs font-bold'>Verified</span>
                    ) : (
                      <span className='text-rose-500 text-xs font-bold'>Mismatch</span>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Stepper Timeline Log */}
            <div className='border-t border-slate-100 pt-5 dark:border-slate-800/80 space-y-4'>
              <h4 className='text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500'>Document Timeline Flow</h4>
              <div className='relative pl-6 space-y-4 border-l border-slate-200 dark:border-slate-800 ml-2'>
                {[
                  { status: 'Uploaded', title: 'Document Uploaded', desc: `File ${docItem.fileName} ingested.`, date: docItem.created_at },
                  { status: 'OCR', title: 'OCR Processing', desc: 'Simulated client-side character extraction completed.', date: docItem.created_at },
                  { status: 'Extraction', title: 'Field Extraction', desc: `Extracted patient details and ${formatCurrency(docItem.claimAmount)} billing amount.`, date: docItem.created_at },
                  { status: 'Validation', title: 'Verification Completed', desc: `Discrepancy validation score: ${resultItem.score}%.`, date: docItem.created_at }
                ].map((step, idx) => (
                  <div key={`timeline-${idx}`} className='relative group'>
                    <div className='absolute -left-[29px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-sky-500 dark:border-slate-950 flex items-center justify-center shrink-0'>
                      <Check className='h-2 w-2 text-white' />
                    </div>
                    <div>
                      <div className='flex items-center justify-between text-xs font-semibold'>
                        <span className='text-slate-800 dark:text-slate-250'>{step.title}</span>
                        <span className='text-[9px] text-slate-450 font-medium'>{new Date(step.date).toLocaleDateString()}</span>
                      </div>
                      <p className='text-[10px] text-slate-550 dark:text-slate-400 mt-0.5 leading-snug'>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes Section */}
            <div className='border-t border-slate-100 pt-5 dark:border-slate-800/80 space-y-4'>
              <h4 className='text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500'>Auditor Comments Log</h4>
              
              <div className='space-y-3 max-h-40 overflow-y-auto scrollbar-none pr-1'>
                {(docItem.notes || []).length === 0 ? (
                  <div className='text-center py-4 text-[10px] text-slate-450 italic'>No notes logged on file yet.</div>
                ) : (
                  docItem.notes.map((n, idx) => (
                    <div key={`note-${idx}`} className='p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/50 dark:border-slate-900 text-xs font-medium space-y-1'>
                      <div className='flex justify-between items-center text-[9px] font-bold text-slate-400'>
                        <span className='text-slate-700 dark:text-slate-350'>{n.analyst}</span>
                        <span>{new Date(n.date).toLocaleDateString()}</span>
                      </div>
                      <p className='text-slate-650 dark:text-slate-300 leading-relaxed'>{n.text}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handlePostNote} className='flex gap-2 relative mt-2'>
                <input
                  type='text'
                  placeholder='Log notes or mismatch findings...'
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className='h-9 flex-1 rounded-xl border border-slate-200 bg-slate-55 pl-3 pr-9 text-xs text-slate-800 focus:outline-none dark:border-slate-850 dark:bg-slate-900 dark:text-slate-200'
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

export default function Documents() {
  const documents = useStore((state) => state.documents || [])
  const verificationResults = useStore((state) => state.verificationResults || [])
  const addDocument = useStore((state) => state.addDocument)
  const updateVerification = useStore((state) => state.updateVerification)
  const addVerificationNote = useStore((state) => state.addVerificationNote)
  const deleteDocument = useStore((state) => state.deleteDocument)

  // Selection & Filters
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterRisk, setFilterRisk] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('desc')
  const pageSize = 8

  // Upload States
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef(null)

  // Initialize mock documents if store is empty
  useEffect(() => {
    if (documents.length === 0) {
      const initialDocs = generateMockDocuments()
      const initialResults = generateMockResults()
      initialDocs.forEach((d, idx) => {
        addDocument(d)
        updateVerification(d.id, d.status, initialResults[idx])
      })
    }
  }, [documents.length, addDocument, updateVerification])

  // Overview stats
  const stats = useMemo(() => {
    const total = documents.length
    if (total === 0) return { total: 0, verified: 0, flagged: 0, accuracy: 0 }
    
    const verified = documents.filter(d => d.status === 'Verified').length
    const flagged = documents.filter(d => d.status === 'Mismatch' || d.status === 'Warning').length
    
    // Average score across verificationResults
    let sumScore = 0
    verificationResults.forEach(r => {
      sumScore += r.score || 0
    })

    return {
      total,
      verified,
      flagged,
      accuracy: total > 0 ? sumScore / total : 0
    }
  }, [documents, verificationResults])

  // Filtering
  const filteredDocs = useMemo(() => {
    return documents.filter((d) => {
      const textMatch =
        d.id.toLowerCase().includes(search.toLowerCase()) ||
        d.fileName.toLowerCase().includes(search.toLowerCase()) ||
        (d.patientName || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.providerName || '').toLowerCase().includes(search.toLowerCase())
      if (!textMatch) return false

      if (filterStatus !== 'All' && d.status !== filterStatus) return false
      if (filterRisk !== 'All' && d.riskLevel !== filterRisk) return false

      return true
    })
  }, [documents, search, filterStatus, filterRisk])

  // Sorting
  const sortedDocs = useMemo(() => {
    return [...filteredDocs].sort((a, b) => {
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
  }, [filteredDocs, sortField, sortDirection])

  // Pagination
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedDocs.slice(start, start + pageSize)
  }, [sortedDocs, currentPage])

  const totalPages = Math.max(1, Math.ceil(sortedDocs.length / pageSize))

  const handleRequestSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // File Upload Handlers
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const simulateOCR = (fileName, fileSize) => {
    setUploading(true)
    setProgress(15)

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(timer)
          return 95
        }
        return prev + 25
      })
    }, 450)

    setTimeout(() => {
      clearInterval(timer)
      setProgress(100)
      
      setTimeout(() => {
        setUploading(false)
        setProgress(0)

        // Generate dynamic mock OCR document matching standard fields
        const docId = `DOC-50${String(documents.length + 1)}`
        
        // Randomly pick a patient and provider combination for discrepancy checks
        const testCase = documents.length % 2 === 0
        const patientName = testCase ? 'John Doe' : 'Alice Cooper'
        const providerName = testCase ? 'Provider B' : 'Provider D'
        const claimAmount = testCase ? 12000 : 7500
        const dateOfService = '2026-05-18'

        const newDoc = {
          id: docId,
          fileName,
          fileSize,
          fileType: fileName.split('.').pop() === 'pdf' ? 'application/pdf' : 'image/jpeg',
          status: testCase ? 'Warning' : 'Verified',
          riskLevel: testCase ? 'Medium' : 'Low',
          patientName,
          providerName,
          claimAmount,
          dateOfService,
          diagnosisCode: 'I10',
          procedureCode: '99213',
          created_at: new Date().toISOString(),
          notes: []
        }

        const newResults = {
          docId,
          score: testCase ? 75 : 100,
          trustRating: testCase ? 'Good' : 'Excellent',
          mismatchCount: testCase ? 1 : 0,
          checks: {
            nameMatch: testCase ? 'warning' : 'verified', // John vs Johnathan
            providerMatch: 'verified',
            amountMatch: 'verified',
            dateMatch: 'verified'
          },
          claimValues: {
            patientName: testCase ? 'Johnathan Doe' : 'Alice Cooper',
            providerName,
            claimAmount,
            dateOfService
          }
        }

        addDocument(newDoc)
        updateVerification(docId, newDoc.status, newResults)
        toast.success(`OCR completed for file ${fileName}!`)
      }, 300)

    }, 2000)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png']
      if (!validTypes.includes(file.type)) {
        toast.error('Only PDF, JPG, and PNG files are accepted.')
        return
      }
      simulateOCR(file.name, `${Math.round(file.size / 1024)} KB`)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      simulateOCR(file.name, `${Math.round(file.size / 1024)} KB`)
    }
  }

  // CSV Exporter
  const handleExportCSV = () => {
    if (filteredDocs.length === 0) return
    const headers = ['Document ID', 'File Name', 'File Size', 'Status', 'Risk Level', 'Patient Name', 'Provider Name', 'Amount', 'Date of Service', 'Upload Date']
    const rows = filteredDocs.map((d) => [
      d.id,
      `"${d.fileName}"`,
      d.fileSize,
      d.status,
      d.riskLevel,
      `"${d.patientName || ''}"`,
      `"${d.providerName || ''}"`,
      d.claimAmount || 0,
      d.dateOfService || '',
      d.created_at
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Documents_Verification_Export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    window.print()
  }

  const activeDocInDrawer = useMemo(() => {
    if (!selectedDoc) return null
    return documents.find(d => d.id === selectedDoc.id) || null
  }, [selectedDoc, documents])

  const activeResultInDrawer = useMemo(() => {
    if (!selectedDoc) return null
    return verificationResults.find(r => r.docId === selectedDoc.id) || null
  }, [selectedDoc, verificationResults])

  const handleResetFilters = () => {
    setSearch('')
    setFilterStatus('All')
    setFilterRisk('All')
    setCurrentPage(1)
  }

  return (
    <section className='space-y-6 relative'>
      {/* Header and Actions (No-print) */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-[linear-gradient(to_right,#faf5ff,#faf8ff,#ffffff)] p-5 shadow-xs dark:border-slate-800/90 dark:bg-[linear-gradient(to_right,rgba(88,28,135,0.18),rgba(76,29,149,0.15),rgba(2,6,23,0.6))] no-print'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5'>
            <ScanLine className='h-3.5 w-3.5 text-purple-500 animate-pulse' />
            Clinical Document Audits Workspace
          </p>
          <h2 className='mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white'>Medical Document Verification Center</h2>
          <p className='mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-350'>
            Upload medical invoices, extract billing metrics using Simulated OCR, identify discrepancy mismatches, and log compliance reviews.
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
            <p className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500'>Total Documents</p>
            <div className='grid h-9 w-9 place-items-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-500/20 shadow-xs'>
              <FileText className='h-4.5 w-4.5' />
            </div>
          </div>
          <p className='font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-3.5'>{stats.total}</p>
          <p className='text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2'>Uploaded medical invoices</p>
        </div>

        <div className='relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/92 p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/80 group'>
          <div className='absolute inset-0 bg-linear-to-br from-emerald-500/10 via-transparent to-transparent -z-10 opacity-30 dark:opacity-20' />
          <div className='flex items-center justify-between'>
            <p className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500'>Verified Matches</p>
            <div className='grid h-9 w-9 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20 shadow-xs'>
              <CheckCircle className='h-4.5 w-4.5' />
            </div>
          </div>
          <p className='font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-3.5'>{stats.verified}</p>
          <p className='text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2'>100% verified consistency matches</p>
        </div>

        <div className='relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/92 p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/80 group'>
          <div className='absolute inset-0 bg-linear-to-br from-rose-500/10 via-transparent to-transparent -z-10 opacity-30 dark:opacity-20' />
          <div className='flex items-center justify-between'>
            <p className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500'>Flagged Discrepancies</p>
            <div className='grid h-9 w-9 place-items-center rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-500/20 shadow-xs'>
              <AlertTriangle className='h-4.5 w-4.5' />
            </div>
          </div>
          <p className='font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-3.5'>{stats.flagged}</p>
          <p className='text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2'>Claims with discrepancy warning/mismatch</p>
        </div>

        <div className='relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/92 p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/80 group'>
          <div className='absolute inset-0 bg-linear-to-br from-purple-500/10 via-transparent to-transparent -z-10 opacity-30 dark:opacity-20' />
          <div className='flex items-center justify-between'>
            <p className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500'>Avg Trust Score</p>
            <div className='grid h-9 w-9 place-items-center rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-500/20 shadow-xs'>
              <Percent className='h-4.5 w-4.5' />
            </div>
          </div>
          <p className='font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-3.5'>{Math.round(stats.accuracy)}%</p>
          <p className='text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2'>Mean validation compliance index</p>
        </div>
      </div>

      {/* Upload zone panel (No-print) */}
      <div className='no-print'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-semibold'>Document Upload Intake & simulated OCR Parser</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Drag & drop upload box */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={cn(
                'border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 min-h-48 relative overflow-hidden',
                dragActive
                  ? 'border-sky-500 bg-sky-500/5 dark:bg-sky-950/10 scale-99'
                  : 'border-slate-250 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-350 dark:border-slate-850 dark:bg-slate-900/10'
              )}
            >
              {uploading ? (
                <div className='space-y-4 w-full max-w-xs'>
                  <div className='flex flex-col items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 font-bold'>
                    <Spinner />
                    <span>OCR Parser extracting metadata...</span>
                  </div>
                  <div className='h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden'>
                    <div className='h-full bg-linear-to-r from-sky-500 to-sky-600 rounded-full transition-all duration-300' style={{ width: `${progress}%` }} />
                  </div>
                  <span className='text-[9px] text-slate-400 block font-semibold'>{progress}% processed</span>
                </div>
              ) : (
                <>
                  <div className='h-12 w-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-500/20 shadow-xs flex items-center justify-center mb-4'>
                    <UploadCloud className='h-6 w-6' />
                  </div>
                  <p className='text-xs font-bold text-slate-700 dark:text-slate-200'>
                    Drag and drop file here, or{' '}
                    <span
                      onClick={() => fileInputRef.current?.click()}
                      className='text-sky-600 dark:text-sky-400 hover:underline cursor-pointer'
                    >
                      browse local directory
                    </span>
                  </p>
                  <p className='text-[10px] text-slate-400 font-semibold mt-1.5'>
                    Supports PDF, JPG, PNG up to 15 MB. Simulation mimics OCR data extraction compared to database values.
                  </p>
                </>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type='file'
                accept='application/pdf,image/jpeg,image/png'
                onChange={handleFileChange}
                className='hidden'
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Queue Explorer Table */}
      <div className='print-area'>
        <Card className='print-card'>
          <CardHeader className='pb-3 border-b border-slate-100 dark:border-slate-800/80 no-print'>
            <div className='flex flex-wrap items-center justify-between gap-4'>
              <div>
                <CardTitle className='text-sm font-semibold'>Verification Queue Registry</CardTitle>
                <p className='text-xs text-slate-450 font-semibold mt-0.5'>Audit extracted invoice records against submitted claim values</p>
              </div>

              {/* Filtering */}
              <div className='flex flex-wrap items-center gap-3 w-full lg:w-auto'>
                <div className='relative w-full sm:w-60'>
                  <Search className='absolute top-2.5 left-3 h-4 w-4 text-slate-400' />
                  <input
                    type='text'
                    placeholder='Search Document ID, File, Patient...'
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    className='h-9 w-full rounded-xl border border-slate-200 bg-slate-55 pl-9 pr-3 text-xs text-slate-800 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                  className='h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350'
                >
                  <option value='All'>All Statuses</option>
                  <option value='Verified'>Verified</option>
                  <option value='Warning'>Warning</option>
                  <option value='Mismatch'>Mismatch</option>
                </select>

                <select
                  value={filterRisk}
                  onChange={(e) => { setFilterRisk(e.target.value); setCurrentPage(1); }}
                  className='h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350'
                >
                  <option value='All'>All Risk Levels</option>
                  <option value='High'>High Only</option>
                  <option value='Medium'>Medium Only</option>
                  <option value='Low'>Low Only</option>
                </select>

                {(search || filterStatus !== 'All' || filterRisk !== 'All') && (
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
                  <th className='py-3'>Document ID</th>
                  <th className='py-3'>File Name</th>
                  <th className='py-3'>Patient Name</th>
                  <th className='py-3'>Billing Provider</th>
                  <th className='py-3 text-right cursor-pointer hover:text-slate-600 dark:hover:text-slate-350' onClick={() => handleRequestSort('claimAmount')}>
                    Invoice Amount <span className='text-[9px]'>{sortField === 'claimAmount' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className='py-3'>Risk Level</th>
                  <th className='py-3'>Verification Status</th>
                  <th className='py-3 text-right cursor-pointer hover:text-slate-650 dark:hover:text-slate-300' onClick={() => handleRequestSort('created_at')}>
                    Upload Date <span className='text-[9px]'>{sortField === 'created_at' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className='py-3 text-center no-print'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100 dark:divide-slate-900'>
                {sortedDocs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className='py-12'>
                      <EmptyState
                        title='No Documents in Queue'
                        description='No document items match your queue search filters.'
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
                  paginatedDocs.map((d) => (
                    <tr
                      key={d.id}
                      className={cn(
                        'hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors cursor-pointer',
                        selectedDoc?.id === d.id ? 'bg-sky-50/20 dark:bg-sky-950/10 font-semibold' : ''
                      )}
                      onClick={() => setSelectedDoc(d)}
                    >
                      <td className='py-3.5 font-extrabold text-slate-900 dark:text-white flex items-center gap-2'>
                        <FileText className='h-4 w-4 text-slate-400' />
                        {d.id}
                      </td>
                      <td className='py-3.5 text-slate-650 dark:text-slate-350 truncate max-w-[140px] font-medium' title={d.fileName}>{d.fileName}</td>
                      <td className='py-3.5 text-slate-805 dark:text-slate-200 font-bold'>{d.patientName}</td>
                      <td className='py-3.5 text-slate-700 dark:text-slate-300 font-semibold'>{d.providerName}</td>
                      <td className='py-3.5 text-right font-medium text-sky-600 dark:text-sky-400'>{formatCurrency(d.claimAmount)}</td>
                      <td className='py-3.5'>{getRiskBadge(d.riskLevel)}</td>
                      <td className='py-3.5'>{getStatusBadge(d.status)}</td>
                      <td className='py-3.5 text-right text-slate-450 dark:text-slate-500'>{new Date(d.created_at).toLocaleDateString()}</td>
                      <td className='py-3.5 text-center no-print' onClick={(e) => e.stopPropagation()}>
                        <button
                          type='button'
                          onClick={() => setSelectedDoc(d)}
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
            {sortedDocs.length > 0 && (
              <div className='flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-slate-800/80 dark:text-slate-400 mt-2 no-print'>
                <div>
                  Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedDocs.length)} of {sortedDocs.length} documents
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

      {/* Slide-over details drawer (No-print) */}
      <AnimatePresence>
        {selectedDoc && (
          <DocumentDrawer
            docItem={activeDocInDrawer}
            resultItem={activeResultInDrawer}
            onClose={() => setSelectedDoc(null)}
            onAddNote={addVerificationNote}
            onDelete={deleteDocument}
          />
        )}
      </AnimatePresence>

    </section>
  )
}
