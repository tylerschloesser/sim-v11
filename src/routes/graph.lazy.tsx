import { createLazyFileRoute } from '@tanstack/react-router'
import { AppGraph } from '../app-graph'

export const Route = createLazyFileRoute('/graph')({
  component: AppGraph,
})
