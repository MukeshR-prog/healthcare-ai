import { cn } from '@/utils/cn'

export function FormField({ label, hint, error, children, className }) {
  return (
    <label className={cn('space-y-1 text-sm', className)}>
      <span className='text-slate-600 dark:text-slate-300'>{label}</span>
      {children}
      {hint ? <p className='text-xs text-slate-500 dark:text-slate-400'>{hint}</p> : null}
      {error ? <p className='text-xs text-rose-600 dark:text-rose-400'>{error}</p> : null}
    </label>
  )
}
