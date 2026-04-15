export function DataTable({ minWidth = 'min-w-[720px]', headers = [], rows = [], renderRow }) {
  return (
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
      <tbody>{rows.map((row, index) => renderRow(row, index))}</tbody>
    </table>
  )
}
