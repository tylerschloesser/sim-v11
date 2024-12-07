import { useEffect, useRef, useState } from 'react'
import invariant from 'tiny-invariant'
import { Vec2 } from '../common/vec2'

export function ViewportContainer({
  children,
  className,
}: {
  children: (viewport: Vec2 | null) => React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState<Vec2 | null>(
    null,
  )
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      invariant(ref.current)
      const rect = ref.current.getBoundingClientRect()
      setViewport(new Vec2(rect.width, rect.height))
    })
    invariant(ref.current)
    ro.observe(ref.current)
    return () => {
      ro.disconnect()
    }
  }, [])
  return (
    <div ref={ref} className={className}>
      {children(viewport)}
    </div>
  )
}
