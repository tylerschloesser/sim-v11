import { enableMapSet } from 'immer'
import { useEffect, useMemo } from 'react'
import { useImmer } from 'use-immer'
import { initNodes, Node, NodeItem, step } from './game'
import { Vec2 } from './vec2'
import { ViewportContainer } from './viewport-container'

enableMapSet()

interface Cell {
  id: string
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
      // setNodes(step)
    }, 100)

    return () => {
      controller.abort()
      self.clearInterval(interval)
    }
  }, [])

  const cells = useMemo(() => {
    return Array.from(nodes.values())
      .filter(
        (node): node is Node & { item: NodeItem } =>
          node.item !== null,
      )
      .map(
        (node) =>
          ({
            id: node.item.id,
            p: new Vec2(node.p.x, node.p.y).add(
              new Vec2(2, 2),
            ),
          }) satisfies Cell,
      )
      .sort((a, b) => a.id.localeCompare(b.id))
  }, [nodes])

  console.log('re-render')

  return (
    <>
      {cells.map((cell) => (
        <div
          key={cell.id}
          className="absolute border-2 border-white transition-transform duration-500"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            transform: `translate(${cell.p.x * size}px, ${cell.p.y * size}px)`,
          }}
        >
          {cell.id}
        </div>
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
