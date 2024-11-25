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

  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
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
    app.stage.addChild(cell.g)
  }
  step()

  const interval = self.setInterval(() => {
    step()
  }, 100)
  signal.addEventListener('abort', () => {
    self.clearInterval(interval)
  })
}

const SCALE_XY = 1e-6
const SCALE_Z = 1e-2

function step() {
  const now = self.performance.now()
  for (const cell of CELLS.values()) {
    const n = noise(
      cell.p.x * SCALE_XY,
      cell.p.y * SCALE_XY,
      (now / 1000) * SCALE_Z,
    )
    cell.g.tint = Math.abs(n) * 0xffffff
  }
}
