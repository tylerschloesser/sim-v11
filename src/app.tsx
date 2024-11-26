import { Application, Graphics } from 'pixi.js'
import { useEffect, useRef } from 'react'
import {
  createNoise4D,
  NoiseFunction4D,
} from 'simplex-noise'
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
        eventFeatures: {
          click: false,
          globalMove: false,
          move: false,
          wheel: false,
        },
      })
      .then(() => {
        init(app, controller.signal)
      })

    return () => {
      controller.abort()
      canvas.remove()
      app.destroy()
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

const SIZE = 16
const CELLS: Map<string, Cell> = (() => {
  const value = new Map<string, Cell>()

  for (let x = 0; x < 32; x++) {
    for (let y = 0; y < 32; y++) {
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

const noise: NoiseFunction4D = (() => {
  const inner = createNoise4D()
  return (x, y, z, w) => {
    const n = inner(x, y, z, w)
    return (n + 1) / 2
  }
})()

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

function octave(cell: Cell, now: number, channel: number) {
  const SCALE_XY = 1e-1
  const SCALE_Z = 2e-4
  const SCALE_W = 1
  let n = noise(
    cell.p.x * SCALE_XY,
    cell.p.y * SCALE_XY,
    now * SCALE_Z,
    channel * SCALE_W,
  )
  n = 1 - n ** 2
  return n
}

function tint(cell: Cell, now: number): number {
  let r = octave(cell, now, 1) < 0.5 ? 0 : 0xff << 0
  let g = octave(cell, now, 2) < 0.5 ? 0 : 0xff << 8
  let b = octave(cell, now, 3) < 0.5 ? 0 : 0xff << 16
  return r | g | b
}

function step() {
  const now = self.performance.now()
  for (const cell of CELLS.values()) {
    cell.g.tint = tint(cell, now)
  }
}
