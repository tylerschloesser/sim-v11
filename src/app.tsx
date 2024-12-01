import { useState } from 'react'
import { Vec2 } from './vec2'
import { ViewportContainer } from './viewport-container'

interface Cell {
  p: Vec2
}

function Canvas({ viewport }: { viewport: Vec2 }) {
  const size = Math.min(viewport.x, viewport.y) / 5

  const [cells] = useState(
    () =>
      [
        {
          p: new Vec2(0, 0),
        },
        {
          p: new Vec2(1, 0),
        },
      ] satisfies Cell[],
  )

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
      <ViewportContainer className="flex-1 relative">
        {(viewport) =>
          viewport ? <Canvas viewport={viewport} /> : null
        }
      </ViewportContainer>
    </div>
  )
}
