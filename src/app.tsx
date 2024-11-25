import { Application, Graphics } from 'pixi.js'
import { useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'
import { Vec2 } from './vec2'

export function App() {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    invariant(container.current)

    const canvas = document.createElement('canvas')
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.display = 'block'
    container.current.appendChild(canvas)

    const viewport = new Vec2(
      window.innerWidth,
      window.innerHeight,
    )

    const app = new Application()
    app
      .init({
        canvas,
        width: viewport.x,
        height: viewport.y,
      })
      .then(() => {
        init(app)
      })

    return () => {
      canvas.remove()
    }
  }, [])
  return (
    <div
      style={{
        width: '100dvw',
        height: '100dvh',
      }}
      ref={container}
    />
  )
}

function init(app: Application) {
  const g = new Graphics()
  g.rect(0, 0, 100, 100)
  g.fill('blue')
  app.stage.addChild(g)
}
