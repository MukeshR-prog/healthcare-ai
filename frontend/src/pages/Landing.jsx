import { motion } from 'framer-motion'
import { Activity, ArrowRight, BarChart3, FileSearch, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const highlights = [
  {
    icon: Activity,
    title: 'Realtime Claim Scoring',
    description: 'Score single claims in seconds with explainable fraud confidence and risk notes.',
  },
  {
    icon: BarChart3,
    title: 'Analytics That Explain',
    description: 'Track provider behavior, fraud trends, and financial exposure in a single dashboard.',
  },
  {
    icon: FileSearch,
    title: 'Batch CSV Intelligence',
    description: 'Upload claim files and process them at scale with clean result exports and history.',
  },
]

export default function Landing() {
  return (
    <div className='relative min-h-screen overflow-hidden bg-app text-slate-900 transition-colors dark:text-slate-100'>
      <div className='pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_12%_14%,rgba(3,105,161,0.25),transparent_32%),radial-gradient(circle_at_86%_16%,rgba(245,158,11,0.2),transparent_28%),radial-gradient(circle_at_50%_88%,rgba(14,165,233,0.16),transparent_40%)]' />
      <div className='pointer-events-none absolute -left-16 top-24 -z-10 h-56 w-56 rounded-full border border-sky-200/40 bg-sky-100/30 blur-2xl dark:border-sky-800/50 dark:bg-sky-900/20' />
      <div className='pointer-events-none absolute -right-20 top-40 -z-10 h-72 w-72 rounded-full border border-amber-200/40 bg-amber-100/25 blur-2xl dark:border-amber-800/50 dark:bg-amber-900/20' />

      <header className='mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-6'>
        <div className='flex items-center gap-3'>
          <div className='grid h-10 w-10 place-items-center rounded-2xl bg-sky-600 text-white'>
            <ShieldCheck className='h-5 w-5' />
          </div>
          <div>
            <p className='font-display text-sm font-semibold'>Healthcare AI</p>
            <p className='text-xs text-slate-500 dark:text-slate-400'>Fraud Intelligence Platform</p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button asChild variant='ghost'>
            <Link to='/login'>Sign in</Link>
          </Button>
          <Button asChild>
            <Link to='/register'>Get started</Link>
          </Button>
        </div>
      </header>

      <main className='mx-auto w-full max-w-6xl px-4 pb-14 pt-8 sm:px-6 sm:pt-14'>
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38 }}
          className='max-w-3xl'
        >
          <p className='mb-3 inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/70 px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300'>
            <span className='h-2 w-2 rounded-full bg-emerald-500' />
            Production-ready risk scoring for healthcare claims
          </p>
          <h1 className='font-display text-4xl font-semibold leading-tight sm:text-5xl'>
            Catch high-risk claims before payout with explainable AI.
          </h1>
          <p className='mt-4 max-w-2xl text-base text-slate-600 dark:text-slate-300 sm:text-lg'>
            Analyze claims one by one or in bulk, then monitor fraud performance with practical analytics your operations teams can act on.
          </p>
          <div className='mt-7 flex flex-wrap items-center gap-3'>
            <Button asChild size='lg' className='group'>
              <Link to='/register'>
                Launch Workspace
                <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-0.5' />
              </Link>
            </Button>
            <Button asChild variant='secondary' size='lg'>
              <Link to='/login'>I already have an account</Link>
            </Button>
          </div>
        </motion.section>

        <section className='mt-12 grid gap-4 sm:grid-cols-3'>
          {highlights.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.34, delay: index * 0.08 }}
              className='rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/70'
            >
              <div className='mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'>
                <item.icon className='h-5 w-5' />
              </div>
              <h2 className='font-display text-lg font-semibold'>{item.title}</h2>
              <p className='mt-2 text-sm text-slate-600 dark:text-slate-300'>{item.description}</p>
            </motion.article>
          ))}
        </section>
      </main>
    </div>
  )
}
