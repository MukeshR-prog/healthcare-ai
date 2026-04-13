import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { parseCsv } from '@/utils/csv'

export function BatchUploadForm({ onSubmit, loading }) {
  const [fileName, setFileName] = useState('')

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const text = await file.text()
    const rows = parseCsv(text)
    onSubmit(rows)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch CSV Upload</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <label className='flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 p-8 text-center transition hover:border-sky-500 dark:border-slate-700 dark:hover:border-sky-500'>
          <span className='text-sm text-slate-500 dark:text-slate-400'>Drop CSV file or click to browse</span>
          <input type='file' accept='.csv' className='hidden' onChange={handleFileChange} />
          <Button type='button' variant='secondary'>
            Select CSV File
          </Button>
        </label>
        {fileName ? <p className='text-xs text-slate-500 dark:text-slate-400'>Uploaded: {fileName}</p> : null}
        {loading ? <p className='text-sm text-sky-600 dark:text-sky-400'>Processing batch analysis...</p> : null}
      </CardContent>
    </Card>
  )
}
