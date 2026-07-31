import { createFileRoute } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/_protected/dashboard/nearby-reports')({
  component: NearbyReports,
})

function NearbyReports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nearby Reports</h1>
        <p className="text-muted-foreground mt-1">Reports near your location</p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Location Based Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No nearby reports found.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
