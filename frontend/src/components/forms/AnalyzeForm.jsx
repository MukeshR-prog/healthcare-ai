import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

const initialState = {
  Provider: 'Provider-1',
  Age: 45,
  ClaimAmount: 1200,
  NumProcedures: 2,
  Gender: 'M',
}

export function AnalyzeForm({ onSubmit, loading }) {
  const [form, setForm] = useState(initialState)

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: ['Age', 'ClaimAmount', 'NumProcedures'].includes(name) ? Number(value) : value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit(form)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card>
        <CardHeader>
          <CardTitle>Single Claim Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='grid gap-4 md:grid-cols-2'>
            <label className='space-y-1 text-sm'>
              <span className='text-slate-600 dark:text-slate-300'>Provider</span>
              <Select name='Provider' value={form.Provider} onChange={onChange}>
                <option>Provider-1</option>
                <option>Provider-2</option>
                <option>Provider-3</option>
                <option>Provider-4</option>
              </Select>
            </label>
            <label className='space-y-1 text-sm'>
              <span className='text-slate-600 dark:text-slate-300'>Age</span>
              <Input name='Age' value={form.Age} type='number' onChange={onChange} required />
            </label>
            <label className='space-y-1 text-sm'>
              <span className='text-slate-600 dark:text-slate-300'>Claim Amount</span>
              <Input name='ClaimAmount' value={form.ClaimAmount} type='number' onChange={onChange} required />
            </label>
            <label className='space-y-1 text-sm'>
              <span className='text-slate-600 dark:text-slate-300'>Number of Procedures</span>
              <Input name='NumProcedures' value={form.NumProcedures} type='number' onChange={onChange} required />
            </label>
            <label className='space-y-1 text-sm'>
              <span className='text-slate-600 dark:text-slate-300'>Gender</span>
              <Select name='Gender' value={form.Gender} onChange={onChange}>
                <option value='M'>Male</option>
                <option value='F'>Female</option>
                <option value='O'>Other</option>
              </Select>
            </label>
            <div className='flex items-end'>
              <Button type='submit' className='w-full' disabled={loading}>
                {loading ? 'Analyzing...' : 'Analyze Claim'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
