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

interface Cell {
  id: string
  p: Vec2
}

const CELLS: Cell[] = (() => {
  const value: Cell[] = []
  for (let x = 0; x < 10; x++) {
    for (let y = 0; y < 10; y++) {
      value.push({
        id: `${x}.${y}`,
        p: new Vec2(x, y),
      })
    }
  }
  return value
})()

function init(app: Application) {
  CELLS.map((cell) => {
    const size = 32
    const g = new Graphics()
    g.rect(cell.p.x * size, cell.p.y * size, size, size)
    g.fill(`hsl(${Math.random() * 360}, 50%, 50%)`)
    app.stage.addChild(g)
  })
}
