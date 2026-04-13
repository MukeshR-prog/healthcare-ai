import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/utils/cn'

export function Progress({ className, value = 0 }) {
  return (
    <ProgressPrimitive.Root
      className={cn('relative h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800', className)}
      value={value}
    >
      <ProgressPrimitive.Indicator
        className='h-full bg-sky-600 transition-all duration-300'
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}
