import { cn } from '@/utils/cn'

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-slate-200/85 bg-white/92 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur transition hover:shadow-[0_1px_2px_rgba(15,23,42,0.05),0_14px_35px_rgba(15,23,42,0.12)] dark:border-slate-800/90 dark:bg-slate-950/82 dark:shadow-[0_1px_2px_rgba(2,6,23,0.35),0_12px_30px_rgba(2,6,23,0.5)]',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex items-center justify-between p-5 pb-3', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn('font-semibold tracking-tight text-slate-900 dark:text-slate-100', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-5 pt-1', className)} {...props} />
}
