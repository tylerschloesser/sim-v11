import {
  createLazyFileRoute,
  Link,
} from '@tanstack/react-router'

export const Route = createLazyFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <ul>
      <li>
        <Link to="/about">Go to /about</Link>
      </li>
      <li>
        <Link to="/graph">Go to /graph</Link>
      </li>
      <li>
        <Link to="/grid">Go to /grid</Link>
      </li>
    </ul>
  )
}
