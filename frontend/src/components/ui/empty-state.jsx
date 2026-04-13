import { Card, CardContent, CardHeader, CardTitle } from './card'

export function EmptyState({ title, description, action }) {
  return (
    <Card className='border-dashed'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 text-sm text-slate-500 dark:text-slate-400'>
        <p>{description}</p>
        {action}
      </CardContent>
    </Card>
  )
}
