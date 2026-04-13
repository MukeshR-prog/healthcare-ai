import { cn } from '@/utils/cn'

export function Badge({ className, tone = 'neutral', ...props }) {
  const styles = {
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    danger: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
    info: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
        styles[tone],
        className,
      )}
      {...props}
    />
  )
}
