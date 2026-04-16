import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function MetricCard({ title, value, icon: Icon, subtitle, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card className='h-full'>
        <div className='pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-sky-100/60 to-transparent dark:from-sky-950/35' />
        <CardHeader>
          <CardTitle className='text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400'>{title}</CardTitle>
          {Icon ? (
            <div className='grid h-8 w-8 place-items-center rounded-xl border border-sky-200 bg-sky-100/80 text-sky-700 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300'>
              <Icon className='h-4 w-4' />
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          <p className='font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100'>{value}</p>
          {subtitle ? <p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>{subtitle}</p> : null}
        </CardContent>
      </Card>
    </motion.div>
  )
}
