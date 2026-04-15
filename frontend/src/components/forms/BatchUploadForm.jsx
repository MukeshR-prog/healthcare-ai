import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/utils/cn'

export function BatchUploadForm({ onSubmit, onPreview, loading }) {
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [dragActive, setDragActive] = useState(false)

  const processFile = async (file) => {
    if (!file) return
    setFileName(file.name)
    setFileSize(file.size)
    if (onPreview) {
      const text = await file.text()
      onPreview(text)
    }
    onSubmit(file)
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    await processFile(file)
  }

  const handleDrop = async (event) => {
    event.preventDefault()
    setDragActive(false)
    const file = event.dataTransfer.files?.[0]
    await processFile(file)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    setDragActive(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch CSV Upload</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <label
          className={cn(
            'flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-8 text-center transition',
            dragActive
              ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/20'
              : 'border-slate-300 hover:border-sky-500 dark:border-slate-700 dark:hover:border-sky-500',
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <span className='text-sm text-slate-500 dark:text-slate-400'>Drop CSV file or click to browse</span>
          <input type='file' accept='.csv' className='hidden' onChange={handleFileChange} />
          <Button type='button' variant='secondary'>
            Select CSV File
          </Button>
        </label>
        {fileName ? (
          <p className='text-xs text-slate-500 dark:text-slate-400'>
            Uploaded: {fileName} ({(fileSize / 1024).toFixed(1)} KB)
          </p>
        ) : null}
        {loading ? (
          <p className='inline-flex items-center gap-2 text-sm text-sky-600 dark:text-sky-400'>
            <Spinner />
            Processing batch analysis...
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
