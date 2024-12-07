import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/grid')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/grid"!</div>
}
