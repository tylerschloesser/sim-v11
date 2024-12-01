import { Vec2 } from './vec2'
import { ViewportContainer } from './viewport-container'

function Canvas({ viewport }: { viewport: Vec2 }) {
  const size = Math.min(viewport.x, viewport.y) / 5

  return (
    <>
      <div
        className="absolute bg-gray-100"
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
      />
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
