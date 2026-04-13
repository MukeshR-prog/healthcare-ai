import { NavLink } from 'react-router-dom'
import { Activity, BarChart3, FileUp, LayoutDashboard, ShieldCheck } from 'lucide-react'
import { cn } from '@/utils/cn'

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/analyze', label: 'Analyze', icon: Activity },
  { to: '/batch-upload', label: 'Batch Upload', icon: FileUp },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export function Sidebar() {
  return (
    <aside className='hidden w-72 shrink-0 border-r border-slate-200/70 bg-white/80 p-5 backdrop-blur lg:block dark:border-slate-800 dark:bg-slate-950/80'>
      <div className='mb-8 flex items-center gap-3'>
        <div className='grid h-10 w-10 place-items-center rounded-2xl bg-sky-600 text-white'>
          <ShieldCheck className='h-5 w-5' />
        </div>
        <div>
          <p className='font-display text-sm font-semibold text-slate-900 dark:text-slate-100'>Healthcare AI</p>
          <p className='text-xs text-slate-500 dark:text-slate-400'>Analytics Platform</p>
        </div>
      </div>

      <nav className='space-y-1'>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                isActive
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white',
              )
            }
          >
            <item.icon className='h-4 w-4' />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
