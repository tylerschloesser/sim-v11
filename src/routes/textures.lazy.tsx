import { createLazyFileRoute } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'

export const Route = createLazyFileRoute('/textures')({
  component: RouteComponent,
})

function RouteComponent() {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    invariant(canvas.current)
    const context = canvas.current.getContext('2d')
    invariant(context)

    context.fillStyle = 'red'
    context.fillRect(0, 0, 100, 100)
  }, [])

  return (
    <div>
      <canvas ref={canvas} width={100} height={100} />
    </div>
  )
}
