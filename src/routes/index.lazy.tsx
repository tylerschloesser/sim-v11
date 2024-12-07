import {
  createLazyFileRoute,
  Link,
} from '@tanstack/react-router'

export const Route = createLazyFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div>
      <Link to="/about">Go to /about</Link>
    </div>
  )
}
