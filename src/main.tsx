import {
  RouterProvider,
  createRouter,
} from '@tanstack/react-router'
import { enableMapSet } from 'immer'
import { createRoot } from 'react-dom/client'
import invariant from 'tiny-invariant'
import './index.css'
import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree })
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

enableMapSet()

const container = document.getElementById('root')
invariant(container)

createRoot(container).render(
  <RouterProvider router={router} />,
)
