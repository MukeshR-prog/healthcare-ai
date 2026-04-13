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
        <CardHeader>
          <CardTitle className='text-sm text-slate-500 dark:text-slate-400'>{title}</CardTitle>
          {Icon ? <Icon className='h-4 w-4 text-sky-600 dark:text-sky-400' /> : null}
        </CardHeader>
        <CardContent>
          <p className='font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100'>{value}</p>
          {subtitle ? <p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>{subtitle}</p> : null}
        </CardContent>
      </Card>
    </motion.div>
  )
}
