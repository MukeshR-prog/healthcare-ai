import { useEffect } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, X, LayoutDashboard, Activity, FileUp, BarChart3, History as HistoryIcon, ShieldAlert, Sparkles } from 'lucide-react'
import Dashboard from '@/pages/Dashboard'
import Alerts from '@/pages/Alerts'
import AIInsights from '@/pages/AIInsights'
import Analyze from '@/pages/Analyze'
import BatchUpload from '@/pages/BatchUpload'
import Analytics from '@/pages/Analytics'
import History from '@/pages/History'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import Landing from '@/pages/Landing'
import { Sidebar } from '@/layouts/Sidebar'
import { Navbar } from '@/layouts/Navbar'
import { useStore } from '@/store/useStore'
import { cn } from '@/utils/cn'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/alerts': 'Alert Management',
  '/ai-insights': 'AI Risk Insights',
  '/analyze': 'Analyze Claim',
  '/batch-upload': 'Batch Upload',
  '/analytics': 'Analytics',
  '/history': 'Claim History',
}

const mobileLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/alerts', label: 'Alerts', icon: ShieldAlert },
  { to: '/ai-insights', label: 'Insights', icon: Sparkles },
  { to: '/analyze', label: 'Analyze', icon: Activity },
  { to: '/batch-upload', label: 'Batch', icon: FileUp },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/history', label: 'History', icon: HistoryIcon },
]

function ProtectedRoute({ children }) {
  const accessToken = useStore((state) => state.auth?.accessToken)
  if (!accessToken) {
    return <Navigate to='/login' replace />
  }
  return children
}

function PublicRoute({ children }) {
  const accessToken = useStore((state) => state.auth?.accessToken)
  if (accessToken) {
    return <Navigate to='/dashboard' replace />
  }
  return children
}

function MobileNav() {
  return (
    <nav className='sticky top-16 z-20 border-b border-slate-200/60 bg-white/70 px-4 py-2 backdrop-blur-md lg:hidden dark:border-slate-800/80 dark:bg-slate-950/75'>
      <div className='flex gap-2 overflow-x-auto pb-1 scrollbar-none'>
        {mobileLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                'rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-200 border',
                isActive
                  ? 'bg-linear-to-r from-sky-600 to-sky-500 text-white shadow-sm border-transparent'
                  : 'bg-white text-slate-600 border-slate-200/80 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800',
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function AppLayout() {
  const location = useLocation()
  const sidebarCollapsed = useStore((state) => state.sidebarCollapsed)
  const mobileSidebarOpen = useStore((state) => state.mobileSidebarOpen)
  const setMobileSidebarOpen = useStore((state) => state.setMobileSidebarOpen)

  return (
    <div className='relative h-dvh overflow-hidden bg-app text-slate-900 transition-colors dark:text-slate-100'>
      <div className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_20%,rgba(14,165,233,0.15),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(99,102,241,0.12),transparent_30%)]' />
      
      <div className='flex h-full min-h-0'>
        {/* Desktop Collapsible Sidebar */}
        <Sidebar />

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <div className='fixed inset-0 z-50 flex lg:hidden'>
              {/* Backdrop overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileSidebarOpen(false)}
                className='fixed inset-0 bg-slate-950/80 backdrop-blur-xs'
              />
              
              {/* Sliding sidebar container */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
                className='relative flex w-72 max-w-[85vw] flex-col bg-white p-5 shadow-2xl dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800'
              >
                <div className='mb-8 flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='grid h-10 w-10 place-items-center rounded-2xl bg-linear-to-tr from-sky-600 to-indigo-600 text-white shadow-md'>
                      <ShieldCheck className='h-5 w-5' />
                    </div>
                    <div>
                      <p className='font-display text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100'>Healthcare AI</p>
                      <p className='text-[10px] text-slate-400 font-medium'>Analytics Platform</p>
                    </div>
                  </div>
                  
                  <button
                    type='button'
                    onClick={() => setMobileSidebarOpen(false)}
                    className='grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                    aria-label='Close menu'
                  >
                    <X className='h-4 w-4' />
                  </button>
                </div>

                <nav className='flex-1 space-y-1.5'>
                  {mobileLinks.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-linear-to-r from-sky-600 to-sky-500 text-white shadow-md shadow-sky-500/10'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900/60 dark:hover:text-white',
                        )
                      }
                    >
                      <item.icon className='h-4 w-4 shrink-0' />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Page Content Area */}
        <div className={cn(
          'flex min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        )}>
          <Navbar title={pageTitles[location.pathname] || 'Healthcare AI'} />
          <MobileNav />
          <main key={location.pathname} className='flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6'>
            <Routes>
              <Route path='/dashboard' element={<Dashboard />} />
              <Route path='/alerts' element={<Alerts />} />
              <Route path='/ai-insights' element={<AIInsights />} />
              <Route path='/analyze' element={<Analyze />} />
              <Route path='/batch-upload' element={<BatchUpload />} />
              <Route path='/analytics' element={<Analytics />} />
              <Route path='/history' element={<History />} />
              <Route path='*' element={<Navigate to='/dashboard' replace />} />
            </Routes>
          </main>
        </div>
      </div>
      <Toaster position='top-right' />
    </div>
  )
}

export default function App() {
  const theme = useStore((state) => state.theme)

  useEffect(() => {
    const root = document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const resolveDarkMode = () => (theme === 'system' ? mediaQuery.matches : theme === 'dark')

    const applyTheme = () => {
      const isDark = resolveDarkMode()
      root.classList.toggle('dark', isDark)
      root.style.colorScheme = isDark ? 'dark' : 'light'
    }

    applyTheme()

    if (theme !== 'system') {
      return undefined
    }

    const handleSystemThemeChange = () => applyTheme()
    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }, [theme])

  return (
    <Routes>
      <Route path='/' element={<Landing />} />
      <Route
        path='/login'
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path='/register'
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path='/forgot-password'
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route
        path='/reset-password'
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />
      <Route
        path='/*'
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
