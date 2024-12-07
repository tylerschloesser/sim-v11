import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/graph')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/graph"!</div>
}
