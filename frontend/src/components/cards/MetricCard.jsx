import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/utils/cn'

const getTheme = (title) => {
  const t = title.toLowerCase()
  if (t.includes('total') || t.includes('volume')) {
    return {
      gradient: 'from-sky-500/10 via-transparent to-transparent',
      border: 'hover:border-sky-500/30 dark:hover:border-sky-500/30',
      iconBg: 'bg-sky-500/10 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-500/20',
      glow: 'hover:shadow-sky-500/5 dark:hover:shadow-sky-500/5',
    }
  }
  if (t.includes('fraud') || t.includes('warning') || t.includes('alert')) {
    return {
      gradient: 'from-rose-500/10 via-transparent to-transparent',
      border: 'hover:border-rose-500/30 dark:hover:border-rose-500/30',
      iconBg: 'bg-rose-500/10 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-500/20',
      glow: 'hover:shadow-rose-500/5 dark:hover:shadow-rose-500/5',
    }
  }
  if (t.includes('average') || t.includes('amount') || t.includes('cost')) {
    return {
      gradient: 'from-emerald-500/10 via-transparent to-transparent',
      border: 'hover:border-emerald-500/30 dark:hover:border-emerald-500/30',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20',
      glow: 'hover:shadow-emerald-500/5 dark:hover:shadow-emerald-500/5',
    }
  }
  // High-Risk or other
  return {
    gradient: 'from-indigo-500/10 via-transparent to-transparent',
    border: 'hover:border-indigo-500/30 dark:hover:border-indigo-500/30',
    iconBg: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-500/20',
    glow: 'hover:shadow-indigo-500/5 dark:hover:shadow-indigo-500/5',
  }
}

export function MetricCard({ title, value, icon: Icon, subtitle, delay = 0 }) {
  const theme = getTheme(title)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ 
        type: 'spring', 
        stiffness: 260, 
        damping: 18,
        initial: { duration: 0.35, delay } 
      }}
      className='h-full'
    >
      <Card className={cn(
        'h-full relative overflow-hidden transition-all duration-300 hover:shadow-lg',
        theme.border,
        theme.glow
      )}>
        {/* Soft glowing color gradient block */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br -z-10 opacity-30 dark:opacity-20 transition-opacity duration-300 group-hover:opacity-40',
          theme.gradient
        )} />
        
        <CardHeader className='flex-row items-center justify-between p-5 pb-3'>
          <CardTitle className='text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500'>
            {title}
          </CardTitle>
          {Icon ? (
            <div className={cn('grid h-9 w-9 place-items-center rounded-2xl shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-xs', theme.iconBg)}>
              <Icon className='h-4.5 w-4.5' />
            </div>
          ) : null}
        </CardHeader>
        
        <CardContent className='p-5 pt-1'>
          <p className='font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100'>
            {value}
          </p>
          {subtitle ? (
            <p className='mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400 leading-normal'>
              {subtitle}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  )
}
