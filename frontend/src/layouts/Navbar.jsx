import { useState, useMemo, useEffect, useRef } from 'react'
import { Bell, Search, LogOut, Sun, Moon, Monitor, ShieldAlert, CheckCircle, AlertTriangle, X, Menu, Settings, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useApi } from '@/hooks/useApi'
import { useStore } from '@/store/useStore'
import { formatCurrency, formatPercent, normalizeFraudValue } from '@/utils/format'
import { cn } from '@/utils/cn'

export function Navbar({ title }) {
  const theme = useStore((state) => state.theme)
  const user = useStore((state) => state.auth?.user)
  const setTheme = useStore((state) => state.setTheme)
  const history = useStore((state) => state.history)
  const toggleMobileSidebar = useStore((state) => state.toggleMobileSidebar)
  const { logout } = useApi()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState(null)
  
  // Notification items
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Anomalous Billing detected', desc: 'Provider Alpha submitted 12 claims in 10 minutes.', type: 'danger', time: '5m ago', unread: true },
    { id: 2, title: 'High-Risk Claim Flagged', desc: 'Claim #CL-98432 exceeds 92.5% risk threshold.', type: 'warning', time: '42m ago', unread: true },
    { id: 3, title: 'AI Model Upgraded', desc: 'Fraud model updated to v2.4 (precision increased by 1.2%).', type: 'success', time: '2h ago', unread: false },
    { id: 4, title: 'Security audit completed', desc: 'No unauthorized access logs found today.', type: 'info', time: '1d ago', unread: false }
  ])

  const unreadCount = notifications.filter(n => n.unread).length

  // Refs for closing on outside click
  const searchRef = useRef(null)
  const notificationRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchFocused(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter claims based on query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const normalizedQuery = searchQuery.toLowerCase()

    // Map history to search items
    const parsedClaims = history.map((item) => ({
      id: item.claim?.id || 'CL-UNKNOWN',
      date: item.claim?.created_at,
      provider: item.claim?.provider || 'Unknown Provider',
      amount: item.claim?.claim_amount || 0,
      fraud: normalizeFraudValue(item.latest_prediction?.prediction),
      riskScore: item.latest_prediction?.risk_probability || 0,
      raw: item
    }))

    return parsedClaims.filter(c => 
      c.id.toLowerCase().includes(normalizedQuery) ||
      c.provider.toLowerCase().includes(normalizedQuery)
    ).slice(0, 5)
  }, [searchQuery, history])

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }

  const markNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n))
  }

  return (
    <>
      <header className='sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md dark:border-slate-800/90 dark:bg-slate-950/75'>
        <div className='flex h-16 items-center justify-between gap-4 px-4 sm:px-6'>
          
          {/* Title / Mobile Menu */}
          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={toggleMobileSidebar}
              className='grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition'
              aria-label='Toggle navigation menu'
            >
              <Menu className='h-5 w-5' />
            </button>
            <div className='hidden sm:block'>
              <h1 className='font-display text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100'>{title}</h1>
              <p className='text-xs text-slate-500 dark:text-slate-400'>Healthcare AI risk intelligence</p>
            </div>
          </div>

          {/* Search bar */}
          <div ref={searchRef} className='relative flex-1 max-w-md'>
            <div className='relative'>
              <Search className='absolute top-3 left-3.5 h-4 w-4 text-slate-400' />
              <input
                type='text'
                placeholder='Search claims (e.g. CL-09, Provider)...'
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSearchFocused(true)
                }}
                onFocus={() => setSearchFocused(true)}
                className='h-10 w-full rounded-xl border border-slate-200/90 bg-slate-50/50 pl-10 pr-12 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-sky-500 dark:focus:bg-slate-950'
              />
              <span className='absolute top-2.5 right-3 hidden items-center gap-0.5 rounded-lg border border-slate-200/80 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-800 dark:bg-slate-950/80 md:flex'>
                Ctrl K
              </span>
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {searchFocused && searchQuery.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className='absolute left-0 mt-2 w-full rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xl backdrop-blur-lg dark:border-slate-800/95 dark:bg-slate-950/95 z-50'
                >
                  <div className='px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500'>
                    Claim Results ({searchResults.length})
                  </div>
                  {searchResults.length === 0 ? (
                    <div className='p-4 text-center text-sm text-slate-500 dark:text-slate-400'>
                      No claims match your query.
                    </div>
                  ) : (
                    <div className='space-y-0.5 mt-1 max-h-80 overflow-y-auto'>
                      {searchResults.map((claim) => (
                        <button
                          key={`${claim.id}-${claim.date}`}
                          type='button'
                          onClick={() => {
                            setSelectedClaim(claim)
                            setSearchFocused(false)
                            setSearchQuery('')
                          }}
                          className='flex w-full items-center justify-between rounded-xl p-2.5 text-left text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/60'
                        >
                          <div>
                            <div className='font-semibold text-slate-800 dark:text-slate-200'>{claim.id}</div>
                            <div className='text-[10px] text-slate-400 mt-0.5'>{claim.provider}</div>
                          </div>
                          <div className='text-right'>
                            <div className='font-medium text-slate-700 dark:text-slate-300'>{formatCurrency(claim.amount)}</div>
                            <div className='mt-1 flex items-center justify-end gap-1.5'>
                              <span className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                claim.fraud ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                              )} />
                              <span className={cn(
                                'text-[10px] font-bold uppercase tracking-wide',
                                claim.fraud ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                              )}>
                                {claim.fraud ? 'Fraud' : 'Safe'}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Action Icons */}
          <div className='flex items-center gap-3'>
            
            {/* Notification Bell */}
            <div ref={notificationRef} className='relative'>
              <button
                type='button'
                onClick={() => setShowNotifications(!showNotifications)}
                className='relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                aria-label='Notifications'
              >
                <Bell className='h-4 w-4' />
                {unreadCount > 0 && (
                  <span className='absolute top-2 right-2 flex h-2 w-2'>
                    <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75'></span>
                    <span className='relative inline-flex h-2 w-2 rounded-full bg-rose-500'></span>
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    className='absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xl backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/95 z-50'
                  >
                    <div className='flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800/80'>
                      <div className='text-xs font-semibold text-slate-800 dark:text-slate-200'>Recent Incidents ({unreadCount})</div>
                      {unreadCount > 0 && (
                        <button
                          type='button'
                          onClick={markAllNotificationsRead}
                          className='text-[10px] font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400'
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    
                    <div className='mt-2 space-y-1.5 max-h-72 overflow-y-auto'>
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={cn(
                            'group flex cursor-pointer gap-2.5 rounded-xl p-2 transition hover:bg-slate-50 dark:hover:bg-slate-900/60',
                            n.unread ? 'bg-sky-50/20 dark:bg-sky-950/10' : ''
                          )}
                        >
                          <div className='mt-0.5 shrink-0'>
                            {n.type === 'danger' && <ShieldAlert className='h-4 w-4 text-rose-500' />}
                            {n.type === 'warning' && <AlertTriangle className='h-4 w-4 text-amber-500' />}
                            {n.type === 'success' && <CheckCircle className='h-4 w-4 text-emerald-500' />}
                            {n.type === 'info' && <Shield className='h-4 w-4 text-sky-500' />}
                          </div>
                          <div className='flex-1 space-y-0.5'>
                            <div className='flex items-center justify-between'>
                              <p className={cn('text-[11px] font-semibold', n.unread ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300')}>
                                {n.title}
                              </p>
                              <span className='text-[9px] text-slate-400'>{n.time}</span>
                            </div>
                            <p className='text-[10px] text-slate-500 leading-normal'>{n.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar Dropdown */}
            <div ref={profileRef} className='relative'>
              <button
                type='button'
                onClick={() => setShowProfile(!showProfile)}
                className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 text-white font-bold text-sm shadow-md shadow-sky-500/10 hover:shadow-sky-500/20 transition-all border border-sky-400/20'
              >
                {user?.email ? user.email[0].toUpperCase() : 'A'}
              </button>

              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    className='absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xl backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/95 z-50'
                  >
                    {/* User Info Header */}
                    <div className='flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800/80'>
                      <div className='grid h-10 w-10 place-items-center rounded-xl bg-linear-to-tr from-sky-500 to-indigo-500 text-white font-bold text-sm'>
                        {user?.email ? user.email[0].toUpperCase() : 'A'}
                      </div>
                      <div className='overflow-hidden'>
                        <p className='truncate text-xs font-semibold text-slate-900 dark:text-white'>{user?.email || 'admin@healthcare.ai'}</p>
                        <p className='text-[10px] text-slate-500 font-medium'>Senior Fraud Operations Lead</p>
                      </div>
                    </div>

                    {/* Quick navigation */}
                    <div className='py-2 border-b border-slate-100 space-y-0.5 dark:border-slate-800/80'>
                      <button type='button' className='flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900/60'>
                        <Settings className='h-3.5 w-3.5' /> Settings
                      </button>
                      <button type='button' className='flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900/60'>
                        <Shield className='h-3.5 w-3.5' /> Audit Log
                      </button>
                    </div>

                    {/* Theme Switcher Segmented Control */}
                    <div className='py-2.5'>
                      <p className='text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 px-1'>Interface Theme</p>
                      <div className='grid grid-cols-3 gap-1 rounded-xl border border-slate-200/80 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900/60'>
                        <button
                          type='button'
                          onClick={() => setTheme('light')}
                          className={cn(
                            'flex h-7 items-center justify-center rounded-lg text-xs font-medium transition',
                            theme === 'light'
                              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800'
                              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                          )}
                          aria-label='Light theme'
                        >
                          <Sun className='h-3.5 w-3.5' />
                        </button>
                        <button
                          type='button'
                          onClick={() => setTheme('dark')}
                          className={cn(
                            'flex h-7 items-center justify-center rounded-lg text-xs font-medium transition',
                            theme === 'dark'
                              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800'
                              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                          )}
                          aria-label='Dark theme'
                        >
                          <Moon className='h-3.5 w-3.5' />
                        </button>
                        <button
                          type='button'
                          onClick={() => setTheme('system')}
                          className={cn(
                            'flex h-7 items-center justify-center rounded-lg text-xs font-medium transition',
                            theme === 'system'
                              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800'
                              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                          )}
                          aria-label='System theme'
                        >
                          <Monitor className='h-3.5 w-3.5' />
                        </button>
                      </div>
                    </div>

                    {/* Logout button */}
                    <button
                      type='button'
                      onClick={logout}
                      className='flex w-full items-center gap-2 rounded-xl bg-rose-50 px-2 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-900/35 transition mt-1'
                    >
                      <LogOut className='h-3.5 w-3.5' /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

        </div>
      </header>

      {/* Claim Detail Inspection Modal Overlay */}
      <AnimatePresence>
        {selectedClaim && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4'>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className='w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950'
            >
              {/* Modal Header */}
              <div className='flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/40'>
                <div>
                  <h3 className='font-display text-base font-semibold text-slate-900 dark:text-slate-100'>
                    Inspect Claim {selectedClaim.id}
                  </h3>
                  <p className='text-xs text-slate-500 dark:text-slate-400'>Deep-dive AI prediction indicators</p>
                </div>
                <button
                  type='button'
                  onClick={() => setSelectedClaim(null)}
                  className='grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>

              {/* Modal Content */}
              <div className='p-6 space-y-5'>
                {/* Highlight Status */}
                <div className={cn(
                  'rounded-2xl border p-4 flex items-start gap-3',
                  selectedClaim.fraud
                    ? 'border-rose-100 bg-rose-50/20 dark:border-rose-950/40 dark:bg-rose-950/10'
                    : 'border-emerald-100 bg-emerald-50/20 dark:border-emerald-950/40 dark:bg-emerald-950/10'
                )}>
                  <div className='mt-0.5 shrink-0'>
                    {selectedClaim.fraud ? (
                      <ShieldAlert className='h-5 w-5 text-rose-500' />
                    ) : (
                      <CheckCircle className='h-5 w-5 text-emerald-500' />
                    )}
                  </div>
                  <div>
                    <h4 className={cn('text-xs font-semibold', selectedClaim.fraud ? 'text-rose-800 dark:text-rose-300' : 'text-emerald-800 dark:text-emerald-300')}>
                      {selectedClaim.fraud ? 'Suspicious Prediction: Fraud' : 'Prediction: Low-Risk Safe'}
                    </h4>
                    <p className='text-[11px] text-slate-500 mt-1 leading-normal'>
                      {selectedClaim.fraud
                        ? `The claims risk scoring logic calculated a high probability of ${formatPercent(selectedClaim.riskScore)} suspicious activity. Check billing codes.`
                        : `The claim is within expected baseline boundaries. Current calculated anomaly probability is ${formatPercent(selectedClaim.riskScore)}.`}
                    </p>
                  </div>
                </div>

                {/* Grid Info */}
                <div className='grid grid-cols-2 gap-4 text-xs'>
                  <div>
                    <span className='text-slate-400 dark:text-slate-500 block font-medium'>Provider</span>
                    <span className='font-semibold text-slate-800 dark:text-slate-200 mt-1 block'>{selectedClaim.provider}</span>
                  </div>
                  <div>
                    <span className='text-slate-400 dark:text-slate-500 block font-medium'>Claim Amount</span>
                    <span className='font-semibold text-slate-800 dark:text-slate-200 mt-1 block text-sky-600 dark:text-sky-400'>{formatCurrency(selectedClaim.amount)}</span>
                  </div>
                  <div>
                    <span className='text-slate-400 dark:text-slate-500 block font-medium'>Processed Date</span>
                    <span className='font-semibold text-slate-800 dark:text-slate-200 mt-1 block'>
                      {selectedClaim.date ? new Date(selectedClaim.date).toLocaleString() : '-'}
                    </span>
                  </div>
                  <div>
                    <span className='text-slate-400 dark:text-slate-500 block font-medium'>Risk Probability</span>
                    <span className={cn(
                      'font-bold mt-1 block',
                      selectedClaim.fraud ? 'text-rose-600' : 'text-emerald-600'
                    )}>
                      {formatPercent(selectedClaim.riskScore)}
                    </span>
                  </div>
                </div>

                {/* Additional diagnostic placeholder */}
                <div className='border-t border-slate-100 pt-4 dark:border-slate-800/80'>
                  <span className='text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2'>Model Diagnostic Features</span>
                  <div className='space-y-1.5'>
                    <div className='flex items-center justify-between text-[11px]'>
                      <span className='text-slate-500 dark:text-slate-400'>Duplicate Billing Check</span>
                      <span className={selectedClaim.fraud ? 'text-rose-500 font-semibold' : 'text-emerald-500'}>
                        {selectedClaim.fraud ? 'Flagged' : 'Normal'}
                      </span>
                    </div>
                    <div className='flex items-center justify-between text-[11px]'>
                      <span className='text-slate-500 dark:text-slate-400'>Unusual Diagnosis Code Mix</span>
                      <span className={selectedClaim.fraud ? 'text-rose-500 font-semibold' : 'text-emerald-500'}>
                        {selectedClaim.fraud ? 'Elevated' : 'Low'}
                      </span>
                    </div>
                    <div className='flex items-center justify-between text-[11px]'>
                      <span className='text-slate-500 dark:text-slate-400'>Geographic billing anomaly</span>
                      <span className='text-emerald-500'>Clear</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className='border-t border-slate-100 bg-slate-50/50 p-4 flex justify-end dark:border-slate-800 dark:bg-slate-900/40'>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => setSelectedClaim(null)}
                  className='rounded-xl'
                >
                  Close Inspection
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
