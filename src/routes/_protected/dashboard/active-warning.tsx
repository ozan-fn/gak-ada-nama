import { createFileRoute } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/_protected/dashboard/active-warning')({
  component: ActiveWarning,
})

function ActiveWarning() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Active Warning</h1>
        <p className="text-muted-foreground mt-1">Current active warnings</p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Active Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No active warnings at the moment.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
