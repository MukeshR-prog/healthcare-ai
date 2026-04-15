import { useEffect } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { motion } from 'framer-motion'
import Dashboard from '@/pages/Dashboard'
import Analyze from '@/pages/Analyze'
import BatchUpload from '@/pages/BatchUpload'
import Analytics from '@/pages/Analytics'
import History from '@/pages/History'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import { Sidebar } from '@/layouts/Sidebar'
import { Navbar } from '@/layouts/Navbar'
import { useStore } from '@/store/useStore'
import { cn } from '@/utils/cn'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/analyze': 'Analyze Claim',
  '/batch-upload': 'Batch Upload',
  '/analytics': 'Analytics',
  '/history': 'Claim History',
}

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
  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/analyze', label: 'Analyze' },
    { to: '/batch-upload', label: 'Batch' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/history', label: 'History' },
  ]

  return (
    <nav className='sticky top-16 z-20 border-b border-slate-200/70 bg-white/80 px-4 py-2 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/75'>
      <div className='flex gap-2 overflow-x-auto'>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                'rounded-xl px-3 py-1.5 text-sm whitespace-nowrap transition',
                isActive
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200',
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
  const theme = useStore((state) => state.theme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div className='min-h-screen overflow-x-hidden bg-app text-slate-900 transition-colors dark:text-slate-100'>
      <div className='absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_20%,rgba(14,165,233,0.18),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(2,132,199,0.14),transparent_30%)]' />
      <div className='flex min-h-screen'>
        <Sidebar />
        <div className='flex min-w-0 flex-1 flex-col'>
          <Navbar title={pageTitles[location.pathname] || 'Healthcare AI'} />
          <MobileNav />
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className='flex-1 p-4 sm:p-6'
          >
            <Routes>
              <Route path='/dashboard' element={<Dashboard />} />
              <Route path='/analyze' element={<Analyze />} />
              <Route path='/batch-upload' element={<BatchUpload />} />
              <Route path='/analytics' element={<Analytics />} />
              <Route path='/history' element={<History />} />
              <Route path='*' element={<Navigate to='/dashboard' replace />} />
            </Routes>
          </motion.main>
        </div>
      </div>
      <Toaster position='top-right' />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
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
