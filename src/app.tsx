import { enableMapSet } from 'immer'
import { useEffect, useMemo } from 'react'
import { useImmer } from 'use-immer'
import { initNodes, step } from './game'
import { Vec2 } from './vec2'
import { ViewportContainer } from './viewport-container'

enableMapSet()

interface Cell {
  p: Vec2
}

function Canvas({ viewport }: { viewport: Vec2 }) {
  const size = Math.min(viewport.x, viewport.y) / 5

  const [nodes, setNodes] = useImmer(initNodes)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    window.addEventListener(
      'keyup',
      (ev) => {
        if (ev.key === 'Enter') {
          setNodes(step)
        }
      },
      { signal },
    )

    const interval = self.setInterval(() => {
      setNodes(step)
    }, 100)

    return () => {
      controller.abort()
      self.clearInterval(interval)
    }
  }, [])

  const cells = useMemo(() => {
    return Array.from(nodes.values())
      .filter((node) => node.item)
      .map(
        (node) =>
          ({
            p: new Vec2(node.p.x, node.p.y).add(
              new Vec2(2, 2),
            ),
          }) satisfies Cell,
      )
  }, [nodes])

  return (
    <>
      {cells.map((cell, i) => (
        <div
          key={i}
          className="absolute border-2 border-white"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${cell.p.x * size}px`,
            top: `${cell.p.y * size}px`,
          }}
        />
      ))}
    </>
  )
}

export function App() {
  return (
    <div className="p-4 w-dvw h-dvh flex">
      <ViewportContainer className="relative flex-1">
        {(viewport) =>
          viewport ? <Canvas viewport={viewport} /> : null
        }
      </ViewportContainer>
    </div>
  )
}
