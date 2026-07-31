import { createFileRoute } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/_protected/dashboard/todays-risk')({
  component: TodaysRisk,
})

function TodaysRisk() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Today's Risk</h1>
        <p className="text-muted-foreground mt-1">Risk assessment for today</p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Risk Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">Low</div>
            <p className="text-muted-foreground mt-2">Overall risk status is normal today.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
