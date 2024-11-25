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
  g: Graphics
}

const SIZE = 32
const CELLS: Map<string, Cell> = (() => {
  const value = new Map<string, Cell>()

  for (let x = 0; x < 10; x++) {
    for (let y = 0; y < 10; y++) {
      const id = `${x}.${y}`

      const g = new Graphics()
      g.rect(x * SIZE, y * SIZE, SIZE, SIZE)
      value.set(id, {
        id,
        p: new Vec2(x, y),
        g,
      })
    }
  }
  return value
})()

function init(app: Application) {
  for (const cell of CELLS.values()) {
    cell.g.fill(`hsl(${Math.random() * 360}, 50%, 50%)`)
    app.stage.addChild(cell.g)
  }
}
