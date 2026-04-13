import { cn } from '@/utils/cn'

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
        className,
      )}
      {...props}
    />
  )
}
