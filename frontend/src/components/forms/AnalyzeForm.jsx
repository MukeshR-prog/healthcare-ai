import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField } from '@/components/forms/FormField'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'

const initialState = {
  Provider: 'A',
  Age: 45,
  ClaimAmount: 12000,
  NumProcedures: 2,
  Gender: 'M',
}

function validate(form) {
  const errors = {}
  if (!['A', 'B', 'C', 'D'].includes(form.Provider)) errors.Provider = 'Choose a valid provider'
  if (!Number.isFinite(form.Age) || form.Age < 0 || form.Age > 120) errors.Age = 'Age must be between 0 and 120'
  if (!Number.isFinite(form.ClaimAmount) || form.ClaimAmount <= 0) errors.ClaimAmount = 'Claim amount must be positive'
  if (!Number.isFinite(form.NumProcedures) || form.NumProcedures < 1) errors.NumProcedures = 'Procedures must be at least 1'
  if (!['M', 'F', 'O'].includes(form.Gender)) errors.Gender = 'Choose a valid gender'
  return errors
}

export function AnalyzeForm({ onSubmit, loading }) {
  const [form, setForm] = useState(initialState)
  const [errors, setErrors] = useState({})

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => {
      const nextForm = {
        ...prev,
        [name]: ['Age', 'ClaimAmount', 'NumProcedures'].includes(name) ? Number(value) : value,
      }
      setErrors(validate(nextForm))
      return nextForm
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0 || loading) return
    await onSubmit(form)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className='h-full'>
        <CardHeader>
          <CardTitle>Single Claim Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='grid gap-4 md:grid-cols-2'>
            <FormField label='Provider' hint='Provider coding used by training data' error={errors.Provider}>
              <Select name='Provider' value={form.Provider} onChange={onChange}>
                <option value='A'>Provider A</option>
                <option value='B'>Provider B</option>
                <option value='C'>Provider C</option>
                <option value='D'>Provider D</option>
              </Select>
            </FormField>
            <FormField label='Age' error={errors.Age}>
              <Input name='Age' value={form.Age} type='number' min={0} max={120} onChange={onChange} required />
            </FormField>
            <FormField label='Claim Amount' hint='USD value of the claim' error={errors.ClaimAmount}>
              <Input name='ClaimAmount' value={form.ClaimAmount} type='number' min={1} step={1} onChange={onChange} required />
            </FormField>
            <FormField label='Number of Procedures' error={errors.NumProcedures}>
              <Input name='NumProcedures' value={form.NumProcedures} type='number' min={1} max={20} onChange={onChange} required />
            </FormField>
            <FormField label='Gender' error={errors.Gender}>
              <Select name='Gender' value={form.Gender} onChange={onChange}>
                <option value='M'>Male</option>
                <option value='F'>Female</option>
                <option value='O'>Other</option>
              </Select>
            </FormField>
            <div className='flex items-end'>
              <Button type='submit' className='w-full' disabled={loading || Object.keys(errors).length > 0}>
                {loading ? (
                  <span className='inline-flex items-center gap-2'>
                    <Spinner />
                    Analyzing...
                  </span>
                ) : (
                  'Analyze Claim'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
