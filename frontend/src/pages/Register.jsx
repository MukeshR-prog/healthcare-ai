import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useApi } from '@/hooks/useApi'
import { useStore } from '@/store/useStore'

export default function Register() {
  const navigate = useNavigate()
  const loading = useStore((state) => state.loadingByKey?.auth)
  const { register } = useApi()
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })

  const onSubmit = async (event) => {
    event.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }

    const result = await register({ email: form.email.trim(), password: form.password })
    if (result?.access_token) {
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-app px-4 py-10'>
      <div className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_18%,rgba(2,132,199,0.2),transparent_32%),radial-gradient(circle_at_84%_74%,rgba(251,146,60,0.22),transparent_30%)]' />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className='w-full max-w-md'
      >
        <Card className='border-slate-200/80 bg-white/92 shadow-xl dark:border-slate-800 dark:bg-slate-950/85'>
          <CardHeader className='pb-4'>
            <div className='mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white'>
              <Sparkles className='h-6 w-6' />
            </div>
            <CardTitle className='font-display text-2xl'>Create workspace</CardTitle>
            <p className='text-sm text-slate-500 dark:text-slate-400'>Set up your production-grade fraud analytics account.</p>
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
                  minLength={8}
                  required
                />
              </div>
              <div className='space-y-1'>
                <label className='text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400'>Confirm Password</label>
                <Input
                  type='password'
                  value={form.confirmPassword}
                  onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  placeholder='Repeat password'
                  minLength={8}
                  required
                />
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword ? (
                <p className='text-xs text-rose-600 dark:text-rose-400'>Passwords do not match.</p>
              ) : null}
              <Button type='submit' className='w-full' disabled={Boolean(loading) || form.password !== form.confirmPassword}>
                {loading ? (
                  <span className='inline-flex items-center gap-2'>
                    <Spinner />
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
            <p className='mt-4 text-center text-sm text-slate-500 dark:text-slate-400'>
              Already have access?{' '}
              <Link to='/login' className='font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400'>
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
