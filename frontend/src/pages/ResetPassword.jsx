import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Spinner } from '@/components/ui/spinner'
import { useApi } from '@/hooks/useApi'
import { useStore } from '@/store/useStore'

export default function ResetPassword() {
  const navigate = useNavigate()
  const loading = useStore((state) => state.loadingByKey?.auth)
  const { resetPassword } = useApi()
  const [form, setForm] = useState({
    token: '',
    newPassword: '',
    confirmPassword: '',
  })

  const onSubmit = async (event) => {
    event.preventDefault()
    if (!form.token.trim() || !form.newPassword || !form.confirmPassword) {
      toast.error('Please complete all fields.')
      return
    }
    if (form.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    const result = await resetPassword({
      token: form.token.trim(),
      new_password: form.newPassword,
    })

    if (result?.message) {
      toast.success(result.message)
      navigate('/login', { replace: true })
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
            <div className='mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white'>
              <KeyRound className='h-6 w-6' />
            </div>
            <CardTitle className='font-display text-2xl'>Reset password</CardTitle>
            <p className='text-sm text-slate-500 dark:text-slate-400'>Enter your reset token and choose a secure new password.</p>
          </CardHeader>
          <CardContent>
            <form className='space-y-4' onSubmit={onSubmit}>
              <div className='space-y-1'>
                <label className='text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400'>Reset Token</label>
                <Input
                  value={form.token}
                  onChange={(event) => setForm((prev) => ({ ...prev, token: event.target.value }))}
                  placeholder='Paste reset token'
                  required
                />
              </div>
              <div className='space-y-1'>
                <label className='text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400'>New Password</label>
                <PasswordInput
                  value={form.newPassword}
                  onChange={(event) => setForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                  placeholder='At least 8 characters'
                  minLength={8}
                  required
                />
              </div>
              <div className='space-y-1'>
                <label className='text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400'>Confirm Password</label>
                <PasswordInput
                  value={form.confirmPassword}
                  onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  placeholder='Repeat new password'
                  minLength={8}
                  required
                />
              </div>
              {form.confirmPassword && form.newPassword !== form.confirmPassword ? (
                <p className='text-xs text-rose-600 dark:text-rose-400'>Passwords do not match.</p>
              ) : null}
              <Button
                type='submit'
                className='w-full'
                disabled={Boolean(loading) || form.newPassword !== form.confirmPassword}
              >
                {loading ? (
                  <span className='inline-flex items-center gap-2'>
                    <Spinner />
                    Updating password...
                  </span>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>

            <p className='mt-4 text-center text-sm text-slate-500 dark:text-slate-400'>
              Need a token?{' '}
              <Link to='/forgot-password' className='font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400'>
                Request here
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
