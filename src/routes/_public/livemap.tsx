import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/livemap')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_public/livemap"!</div>
}
