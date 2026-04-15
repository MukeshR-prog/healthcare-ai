import { Laptop, LogOut, MoonStar, SunMedium } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApi } from '@/hooks/useApi'
import { useStore } from '@/store/useStore'

export function Navbar({ title }) {
  const theme = useStore((state) => state.theme)
  const user = useStore((state) => state.auth?.user)
  const setTheme = useStore((state) => state.setTheme)
  const { logout } = useApi()

  return (
    <header className='sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/75'>
      <div className='flex h-16 items-center justify-between gap-3 px-4 sm:px-6'>
        <div>
          <h1 className='font-display text-xl font-semibold text-slate-900 dark:text-slate-100'>{title}</h1>
          <p className='text-xs text-slate-500 dark:text-slate-400'>Real-time healthcare risk intelligence</p>
        </div>
        <div className='flex items-center gap-2'>
          <div className='hidden rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 md:block dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'>
            {user?.email || 'Signed in'}
          </div>
          <div className='hidden items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 md:flex dark:border-slate-700 dark:bg-slate-900'>
            <Button
              variant={theme === 'light' ? 'default' : 'ghost'}
              size='icon'
              onClick={() => setTheme('light')}
              aria-label='Use light theme'
            >
              <SunMedium className='h-4 w-4' />
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'ghost'}
              size='icon'
              onClick={() => setTheme('dark')}
              aria-label='Use dark theme'
            >
              <MoonStar className='h-4 w-4' />
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'ghost'}
              size='icon'
              onClick={() => setTheme('system')}
              aria-label='Use system theme'
            >
              <Laptop className='h-4 w-4' />
            </Button>
          </div>
          <Button
            variant='secondary'
            size='icon'
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label='Toggle dark mode'
            className='md:hidden'
          >
            {theme === 'dark' ? <SunMedium className='h-4 w-4' /> : <MoonStar className='h-4 w-4' />}
          </Button>
          <Button variant='ghost' size='icon' onClick={logout} aria-label='Logout'>
            <LogOut className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </header>
  )
}
