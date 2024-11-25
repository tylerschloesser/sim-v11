import { useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'

export function App() {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    invariant(container.current)
    console.log('hello!')
  }, [])
  return <div ref={container} />
}
