import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ChartContainer({ title, subtitle, rightSlot, children, className = 'h-80' }) {
  return (
    <Card>
      <div className='pointer-events-none absolute inset-x-0 top-0 h-18 bg-[linear-gradient(to_bottom,rgba(224,242,254,0.55),transparent)] dark:bg-[linear-gradient(to_bottom,rgba(12,74,110,0.3),transparent)]' />
      <CardHeader className='relative z-10'>
        <div>
          <CardTitle className='font-display text-base'>{title}</CardTitle>
          {subtitle ? <p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>{subtitle}</p> : null}
        </div>
        {rightSlot ? <div className='shrink-0'>{rightSlot}</div> : null}
      </CardHeader>
      <CardContent className={className}>{children}</CardContent>
    </Card>
  )
}
