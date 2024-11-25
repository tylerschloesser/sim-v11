import { Application, Graphics } from 'pixi.js'
import { useEffect, useRef } from 'react'
import { createNoise3D } from 'simplex-noise'
import invariant from 'tiny-invariant'
import { Vec2 } from './vec2'

export function App() {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    invariant(container.current)
    const controller = new AbortController()

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
        init(app, controller.signal)
      })

    return () => {
      controller.abort()
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

const noise = createNoise3D()

function init(app: Application, signal: AbortSignal) {
  for (const cell of CELLS.values()) {
    cell.g.fill('white')
    cell.g.tint = Math.random() * 0xffffff
    app.stage.addChild(cell.g)
  }

  const interval = self.setInterval(() => {
    for (const cell of CELLS.values()) {
      cell.g.tint = Math.random() * 0xffffff
    }
  }, 1000)
  signal.addEventListener('abort', () => {
    self.clearInterval(interval)
  })
}
