import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'

export function DataTable({
  minWidth = 'min-w-[720px]',
  headers = [],
  rows = [],
  renderRow,
  pageSize = 8,
  showPagination = true,
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(pageSize)

  const totalPages = Math.max(Math.ceil(rows.length / rowsPerPage), 1)
  const safePage = Math.min(currentPage, totalPages)

  const paginatedRows = useMemo(() => {
    if (!showPagination) return rows
    const start = (safePage - 1) * rowsPerPage
    return rows.slice(start, start + rowsPerPage)
  }, [rows, rowsPerPage, safePage, showPagination])

  const startRow = rows.length ? (safePage - 1) * rowsPerPage + 1 : 0
  const endRow = rows.length ? Math.min(startRow + paginatedRows.length - 1, rows.length) : 0

  return (
    <div className='space-y-4'>
      <table className={`w-full ${minWidth} text-sm`}>
        <thead>
          <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400'>
            {headers.map((header) => (
              <th key={header.key} className='py-3'>
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map((row, index) => {
            const absoluteIndex = (safePage - 1) * rowsPerPage + index
            return renderRow(row, absoluteIndex)
          })}
        </tbody>
      </table>

      {showPagination && rows.length > 0 ? (
        <div className='flex flex-col gap-3 border-t border-slate-200 pt-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:text-slate-400'>
          <div>
            Showing {startRow}-{endRow} of {rows.length}
          </div>
          <div className='flex items-center gap-2'>
            <label className='inline-flex items-center gap-2'>
              Rows
              <select
                className='h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                value={rowsPerPage}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value))
                  setCurrentPage(1)
                }}
              >
                <option value={5}>5</option>
                <option value={8}>8</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </label>
            <Button variant='secondary' size='sm' disabled={safePage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
              Prev
            </Button>
            <span className='px-1'>
              {safePage}/{totalPages}
            </span>
            <Button
              variant='secondary'
              size='sm'
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
