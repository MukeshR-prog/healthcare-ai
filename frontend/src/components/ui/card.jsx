import { cn } from '@/utils/cn'

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex items-center justify-between p-5 pb-2', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn('font-semibold tracking-tight text-slate-900 dark:text-slate-100', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-5 pt-2', className)} {...props} />
}
