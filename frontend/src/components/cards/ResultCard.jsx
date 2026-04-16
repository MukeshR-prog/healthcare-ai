import { Card, CardContent } from '@/components/ui/card'

function normalizeJsonCandidate(value) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  if (trimmed.startsWith('```')) {
    const withoutFenceStart = trimmed.replace(/^```(?:json)?\s*/i, '')
    return withoutFenceStart.replace(/\s*```$/, '').trim()
  }

  return trimmed
}

function parseStructuredValue(value) {
  if (value && typeof value === 'object') {
    return value
  }

  const candidate = normalizeJsonCandidate(value)
  if (!candidate) {
    return null
  }

  try {
    return JSON.parse(candidate)
  } catch {
    return null
  }
}

function formatLabel(key) {
  return String(key)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function renderStructured(value, depth = 0) {
  if (value == null) {
    return <span className='text-slate-500 dark:text-slate-400'>N/A</span>
  }

  if (depth > 2) {
    return <span className='whitespace-pre-wrap wrap-break-word'>{JSON.stringify(value)}</span>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className='text-slate-500 dark:text-slate-400'>No items</span>
    }
    return (
      <ul className='list-disc space-y-1 pl-4'>
        {value.map((item, index) => (
          <li key={`${index}-${typeof item}`}>{renderStructured(item, depth + 1)}</li>
        ))}
      </ul>
    )
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value)
    if (entries.length === 0) {
      return <span className='text-slate-500 dark:text-slate-400'>No details</span>
    }

    return (
      <div className='space-y-2'>
        {entries.map(([key, itemValue]) => (
          <div key={key} className='rounded-lg border border-slate-200/80 bg-white/70 p-2.5 dark:border-slate-800 dark:bg-slate-900/60'>
            <p className='text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400'>{formatLabel(key)}</p>
            <div className='mt-1 whitespace-pre-wrap wrap-break-word text-sm text-slate-700 dark:text-slate-300'>{renderStructured(itemValue, depth + 1)}</div>
          </div>
        ))}
      </div>
    )
  }

  return <span className='whitespace-pre-wrap wrap-break-word'>{String(value)}</span>
}

export function ResultCard({ title, value, className = '' }) {
  const structured = parseStructuredValue(value)

  return (
    <Card className={className}>
      <CardContent className='space-y-2 p-4'>
        <p className='text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400'>{title}</p>
        <div className='text-sm text-slate-700 dark:text-slate-300'>
          {structured ? renderStructured(structured) : <span className='whitespace-pre-wrap wrap-break-word'>{value}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
