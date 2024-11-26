import { Application, Graphics } from 'pixi.js'
import { useEffect, useRef } from 'react'
import {
  createNoise3D,
  NoiseFunction2D,
  NoiseFunction3D,
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

const noise: NoiseFunction3D = (() => {
  const inner = createNoise3D()
  return (x, y, z) => {
    const n = inner(x, y, z)
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

function octave1(cell: Cell, now: number) {
  const SCALE_XY = 1e-1 * 0.5
  const SCALE_Z = 2e-4
  let n = noise(
    cell.p.x * SCALE_XY,
    cell.p.y * SCALE_XY,
    now * SCALE_Z,
  )
  n = 1 - n ** 10
  return n
}
function octave2(cell: Cell, now: number) {
  const SCALE_XY = 1e-1
  const SCALE_Z = 2e-4
  let n = noise(
    cell.p.x * SCALE_XY,
    cell.p.y * SCALE_XY,
    now * SCALE_Z,
  )
  n = 1 - n ** 1
  return n
}

const WEIGHTS = [0.5, 0.5]

invariant(WEIGHTS.reduce((acc, v) => acc + v, 0) === 1)

function tint(cell: Cell, now: number): number {
  let n =
    octave1(cell, now) * WEIGHTS[0] +
    octave2(cell, now) * WEIGHTS[1]
  let r = Math.floor(0xff * n) << 0
  let g = r << 8
  let b = r << 16
  return r | g | b
}

function step() {
  const now = self.performance.now()
  for (const cell of CELLS.values()) {
    cell.g.tint = tint(cell, now)
  }
}
