import { createFileRoute } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/_protected/dashboard/recent-activity')({
  component: RecentActivity,
})

function RecentActivity() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recent Activity</h1>
        <p className="text-muted-foreground mt-1">Latest activities and updates</p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent activity logged.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
