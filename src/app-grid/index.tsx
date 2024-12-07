import { uniqueId } from 'lodash-es'
import * as PIXI from 'pixi.js'
import { useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'
import { Vec2 } from '../common/vec2'

export function AppGrid() {
  return (
    <div className="w-dvw h-dvh">
      <Canvas />
    </div>
  )
}

interface PixiState {
  id: string
  canvas: HTMLCanvasElement
  app: PIXI.Application
  ro: ResizeObserver
  controller: AbortController
}

const cache = new Map<string, Promise<PixiState>>()

function initPixi(
  id: string,
  container: HTMLDivElement,
): Promise<PixiState> {
  const promise: Promise<PixiState> = new Promise(
    async (resolve) => {
      const { width, height } =
        container.getBoundingClientRect()

      const canvas = document.createElement('canvas')
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      canvas.width = width
      canvas.height = height
      container.appendChild(canvas)

      const app = new PIXI.Application()
      await app.init({
        canvas,
        width: canvas.width,
        height: canvas.height,
        antialias: true,
      })

      const ro = new ResizeObserver(() => {
        const { width, height } =
          canvas.getBoundingClientRect()
        if (
          canvas.width === width &&
          canvas.height === height
        ) {
          return
        }
        canvas.width = width
        canvas.height = height
        app.resize()
      })
      ro.observe(canvas)

      const controller = new AbortController()
      const { signal } = controller

      const cellSize = 100
      const g = initGraphics(app, cellSize, width, height)

      let camera = Vec2.ZERO
      let pointerDown: Vec2 | null = null
      let delta = Vec2.ZERO

      function updateCamera() {
        g.grid.position.set(
          camera.x + delta.x,
          camera.y + delta.y,
        )
      }

      document.addEventListener(
        'pointermove',
        (ev) => {
          g.pointer.position.set(ev.offsetX, ev.offsetY)

          if (pointerDown !== null) {
            const p = new Vec2(ev.offsetX, ev.offsetY)
            delta = p.sub(pointerDown)
            updateCamera()
          }
        },
        { signal },
      )

      document.addEventListener(
        'pointerdown',
        (ev) => {
          pointerDown = new Vec2(ev.offsetX, ev.offsetY)
        },
        { signal },
      )

      document.addEventListener(
        'pointerup',
        (_ev) => {
          pointerDown = null
          camera = camera.add(delta)
          delta = Vec2.ZERO
          updateCamera()
        },
        { signal },
      )

      resolve({ id, canvas, app, ro, controller })
    },
  )
  cache.set(id, promise)
  return promise
}

function initGraphics(
  app: PIXI.Application,
  cellSize: number,
  width: number,
  height: number,
) {
  const g = {
    pointer: new PIXI.Graphics(),
    grid: new PIXI.Graphics(),
  }

  {
    const cols = Math.ceil(width / cellSize) + 1
    const rows = Math.ceil(height / cellSize) + 1
    g.grid.setStrokeStyle({
      color: 'hsl(0, 0%, 30%)',
      width: 1,
    })
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        g.grid
          .moveTo(col * cellSize, 0)
          .lineTo(col * cellSize, rows * cellSize)
          .moveTo(0, row * cellSize)
          .lineTo(cols * cellSize, row * cellSize)
      }
    }
    g.grid.stroke()
    app.stage.addChild(g.grid)
  }

  {
    g.pointer.circle(0, 0, 20)
    g.pointer.stroke({
      color: 'blue',
      width: 2,
    })
    app.stage.addChild(g.pointer)
  }

  return g
}

function destroyPixi(id: string) {
  const promise = cache.get(id)
  invariant(promise)
  promise.then((state) => {
    state.canvas.style.display = 'none'
    state.ro.disconnect()
    state.app.destroy()
    state.canvas.remove()
    cache.delete(id)
  })
}

export function Canvas() {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    invariant(container.current)
    const id = uniqueId()
    initPixi(id, container.current)
    return () => {
      destroyPixi(id)
    }
  }, [])

  return <div ref={container} className="w-full h-full" />
}
