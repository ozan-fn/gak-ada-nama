import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/reports')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_public/reports"!</div>
}
