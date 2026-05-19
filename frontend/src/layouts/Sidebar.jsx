import { NavLink } from 'react-router-dom'
import { Activity, BarChart3, FileUp, History, LayoutDashboard, ShieldCheck, ChevronLeft, ChevronRight, ShieldAlert, Sparkles, ClipboardCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { cn } from '@/utils/cn'

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/alerts', label: 'Alerts', icon: ShieldAlert },
  { to: '/investigations', label: 'Investigations', icon: ClipboardCheck },
  { to: '/ai-insights', label: 'AI Insights', icon: Sparkles },
  { to: '/analyze', label: 'Analyze', icon: Activity },
  { to: '/batch-upload', label: 'Batch Upload', icon: FileUp },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/history', label: 'History', icon: History },
]

export function Sidebar() {
  const sidebarCollapsed = useStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useStore((state) => state.toggleSidebar)

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 80 : 288 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className='fixed inset-y-0 left-0 z-40 hidden h-dvh overflow-hidden border-r border-slate-200/70 bg-white/92 p-4 backdrop-blur lg:flex lg:flex-col lg:justify-between dark:border-slate-800/90 dark:bg-slate-950/80'
    >
      <div className='space-y-6'>
        {/* Logo Section */}
        <div className={cn('flex items-center gap-3', sidebarCollapsed ? 'justify-center py-2' : 'px-2 py-1')}>
          <div className='grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-linear-to-tr from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/20'>
            <ShieldCheck className='h-5 w-5' />
          </div>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <p className='font-display text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100'>Healthcare AI</p>
              <p className='text-xs text-slate-500 dark:text-slate-400'>Analytics Platform</p>
            </motion.div>
          )}
        </div>

        {/* Nav Links */}
        <nav className='space-y-1.5'>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-linear-to-r from-sky-600 to-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900/60 dark:hover:text-white',
                  sidebarCollapsed && 'justify-center'
                )
              }
            >
              <item.icon className={cn('h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110')} />
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  className='truncate'
                >
                  {item.label}
                </motion.span>
              )}

              {/* Tooltip for Collapsed Mode */}
              {sidebarCollapsed && (
                <div className='absolute left-18 z-50 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-250 pointer-events-none bg-slate-900 text-white text-xs font-semibold rounded-xl px-3 py-2 whitespace-nowrap shadow-xl border border-slate-800 dark:bg-slate-800 dark:border-slate-700'>
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Collapse Action Toggle at the bottom */}
      <div className={cn('flex border-t border-slate-200/50 pt-3 dark:border-slate-800/50', sidebarCollapsed ? 'justify-center' : 'justify-end px-2')}>
        <button
          type='button'
          onClick={toggleSidebar}
          className='flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition shadow-xs'
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className='h-4 w-4' /> : <ChevronLeft className='h-4 w-4' />}
        </button>
      </div>
    </motion.aside>
  )
}
