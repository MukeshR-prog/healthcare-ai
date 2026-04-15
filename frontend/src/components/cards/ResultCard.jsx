import { Card, CardContent } from '@/components/ui/card'

export function ResultCard({ title, value, className = '' }) {
  return (
    <Card className={className}>
      <CardContent className='space-y-2 p-4'>
        <p className='text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400'>{title}</p>
        <div className='text-sm text-slate-700 dark:text-slate-300'>{value}</div>
      </CardContent>
    </Card>
  )
}
