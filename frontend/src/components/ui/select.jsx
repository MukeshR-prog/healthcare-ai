import { cn } from '@/utils/cn'

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
