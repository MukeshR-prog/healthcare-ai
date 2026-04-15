import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/cn'

export function PasswordInput({ className, ...props }) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className='relative'>
      <Input type={showPassword ? 'text' : 'password'} className={cn('pr-10', className)} {...props} />
      <button
        type='button'
        onClick={() => setShowPassword((prev) => !prev)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        className='absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
      >
        {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
      </button>
    </div>
  )
}
