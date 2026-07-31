import { createFileRoute } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/_protected/dashboard/total-reports')({
  component: TotalReports,
})

function TotalReports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Total Reports</h1>
        <p className="text-muted-foreground mt-1">View all reports</p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Reports Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No reports data yet. Check back later.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
