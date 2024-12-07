import { createLazyFileRoute } from '@tanstack/react-router'
import { AppGrid } from '../app-grid'

export const Route = createLazyFileRoute('/grid')({
  component: RouteComponent,
})

function RouteComponent() {
  return <AppGrid />
}
