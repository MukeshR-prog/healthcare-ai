import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MailCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useApi } from '@/hooks/useApi'
import { useStore } from '@/store/useStore'

export default function ForgotPassword() {
  const loading = useStore((state) => state.loadingByKey?.auth)
  const { forgotPassword } = useApi()
  const [email, setEmail] = useState('')
  const [result, setResult] = useState(null)

  const onSubmit = async (event) => {
    event.preventDefault()
    const value = email.trim()
    if (!value) {
      toast.error('Please enter your email.')
      return
    }

    const response = await forgotPassword({ email: value })
    if (!response) {
      return
    }
    setResult(response)
  }

  return (
    <div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-app px-4 py-10'>
      <div className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_14%_20%,rgba(14,165,233,0.25),transparent_33%),radial-gradient(circle_at_88%_15%,rgba(245,158,11,0.18),transparent_28%)]' />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className='w-full max-w-md'
      >
        <Card className='border-slate-200/80 bg-white/92 shadow-xl dark:border-slate-800 dark:bg-slate-950/85'>
          <CardHeader className='pb-4'>
            <div className='mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white'>
              <MailCheck className='h-6 w-6' />
            </div>
            <CardTitle className='font-display text-2xl'>Forgot password</CardTitle>
            <p className='text-sm text-slate-500 dark:text-slate-400'>Request a reset token to set a new password.</p>
          </CardHeader>
          <CardContent>
            <form className='space-y-4' onSubmit={onSubmit}>
              <div className='space-y-1'>
                <label className='text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400'>Email</label>
                <Input
                  type='email'
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder='you@company.com'
                  required
                />
              </div>
              <Button type='submit' className='w-full' disabled={Boolean(loading)}>
                {loading ? (
                  <span className='inline-flex items-center gap-2'>
                    <Spinner />
                    Requesting token...
                  </span>
                ) : (
                  'Send Reset Token'
                )}
              </Button>
            </form>

            {result ? (
              <div className='mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60'>
                <p className='text-sm text-slate-600 dark:text-slate-300'>{result.message || 'If your account exists, a token has been generated.'}</p>
                {result.reset_token ? (
                  <div>
                    <p className='mb-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400'>Reset token (demo)</p>
                    <p className='break-all rounded-md bg-white px-2 py-1 text-xs text-slate-700 dark:bg-slate-950 dark:text-slate-200'>
                      {result.reset_token}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className='mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400'>
              <Link to='/login' className='font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400'>
                Back to login
              </Link>
              <Link to='/reset-password' className='font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400'>
                Already have token?
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
