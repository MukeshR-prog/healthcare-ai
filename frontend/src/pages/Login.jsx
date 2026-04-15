import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useApi } from '@/hooks/useApi'
import { useStore } from '@/store/useStore'

export default function Login() {
  const navigate = useNavigate()
  const loading = useStore((state) => state.loadingByKey?.auth)
  const { login } = useApi()
  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const onSubmit = async (event) => {
    event.preventDefault()
    const payload = {
      email: form.email.trim(),
      password: form.password,
    }
    if (!payload.email || !payload.password) {
      toast.error('Please fill in both email and password.')
      return
    }
    const result = await login(payload)
    if (result?.access_token) {
      navigate('/dashboard', { replace: true })
    }
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
              <ShieldCheck className='h-6 w-6' />
            </div>
            <CardTitle className='font-display text-2xl'>Welcome back</CardTitle>
            <p className='text-sm text-slate-500 dark:text-slate-400'>Sign in to your fraud intelligence workspace.</p>
          </CardHeader>
          <CardContent>
            <form className='space-y-4' onSubmit={onSubmit}>
              <div className='space-y-1'>
                <label className='text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400'>Email</label>
                <Input
                  type='email'
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder='you@company.com'
                  required
                />
              </div>
              <div className='space-y-1'>
                <label className='text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400'>Password</label>
                <Input
                  type='password'
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder='At least 8 characters'
                  required
                />
              </div>
              <Button type='submit' className='w-full' disabled={Boolean(loading)}>
                {loading ? (
                  <span className='inline-flex items-center gap-2'>
                    <Spinner />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            <p className='mt-4 text-center text-sm text-slate-500 dark:text-slate-400'>
              New here?{' '}
              <Link to='/register' className='font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400'>
                Create account
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
