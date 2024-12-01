import { Vec2 } from './vec2'
import { ViewportContainer } from './viewport-container'

function Canvas({ viewport }: { viewport: Vec2 }) {
  return <>{JSON.stringify(viewport)}</>
}

export function App() {
  return (
    <div className="p-4 w-dvw h-dvh flex">
      <ViewportContainer className="flex-1">
        {(viewport) =>
          viewport ? <Canvas viewport={viewport} /> : null
        }
      </ViewportContainer>
    </div>
  )
}
