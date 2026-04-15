import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ChartContainer({ title, children, className = 'h-72' }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className={className}>{children}</CardContent>
    </Card>
  )
}
