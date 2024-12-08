import { debounce, uniqueId } from 'lodash-es'
import * as PIXI from 'pixi.js'
import { useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'
import { mod } from '../common/math'
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

      const reloadOnResize = debounce(
        window.location.reload.bind(window.location),
        500,
      )

      const ro = new ResizeObserver(() => {
        const { width, height } =
          canvas.getBoundingClientRect()
        if (
          canvas.width === width &&
          canvas.height === height
        ) {
          return
        }
        // TODO dynamically update canvas size
        reloadOnResize()
        // canvas.width = width
        // canvas.height = height
        // app.resize()
      })
      ro.observe(canvas)

      const controller = new AbortController()
      const { signal } = controller

      const viewport = new Vec2(width, height)
      const cellSize = 32
      const g = initGraphics(app, cellSize, viewport)

      let camera = Vec2.ZERO
      // @ts-ignore
      let pointer: Vec2 | null = null
      let pointerDown: Vec2 | null = null
      let delta = Vec2.ZERO

      function updateCamera() {
        {
          const t = camera
            .mul(cellSize)
            .add(delta)
            .mul(-1)
            .add(viewport.div(2))
          g.grid.position.set(
            mod(t.x, cellSize) - cellSize,
            mod(t.y, cellSize) - cellSize,
          )
        }

        {
          const t = camera
            .mul(cellSize)
            .add(delta)
            .mul(-1)
            .add(viewport.div(2))
          g.world.position.set(t.x, t.y)
        }
      }
      updateCamera()

      function screenToWorld(screen: Vec2): Vec2 {
        return screen.div(cellSize)
      }

      function worldToScreen(world: Vec2): Vec2 {
        return world.mul(cellSize)
      }

      document.addEventListener(
        'pointerenter',
        (ev) => {
          pointer = new Vec2(ev.offsetX, ev.offsetY)
          const world = screenToWorld(pointer)
          const screen = worldToScreen(world).floor()

          g.pointer.visible = true
          g.pointer.position.set(screen.x, screen.y)
        },
        { signal },
      )

      document.addEventListener(
        'pointermove',
        (ev) => {
          pointer = new Vec2(ev.offsetX, ev.offsetY)
          const world = screenToWorld(pointer)
          const screen = worldToScreen(world.floor())

          g.pointer.visible = true
          g.pointer.position.set(screen.x, screen.y)

          if (pointerDown !== null) {
            const p = new Vec2(ev.offsetX, ev.offsetY)
            delta = pointerDown.sub(p)
            updateCamera()
          }
        },
        { signal },
      )

      document.addEventListener(
        'pointerleave',
        (_ev) => {
          pointer = null
          g.pointer.visible = false
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
          camera = camera.add(delta.div(cellSize))
          console.log('camera', camera)
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
  viewport: Vec2,
) {
  const g = {
    pointer: new PIXI.Graphics(),
    grid: new PIXI.Graphics(),
    world: new PIXI.Graphics(),
  }

  {
    const cols = Math.ceil(viewport.x / cellSize) + 1
    const rows = Math.ceil(viewport.y / cellSize) + 1
    g.grid.setStrokeStyle({
      color: 'hsl(0, 0%, 20%)',
      width: 2,
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
    g.world.rect(0, 0, cellSize, cellSize)
    g.world.fill('hsl(0, 50%, 50%)')
    g.world.rect(-cellSize, -cellSize, cellSize, cellSize)
    g.world.fill('hsl(120, 50%, 50%)')
    app.stage.addChild(g.world)
  }

  {
    g.pointer.visible = false
    g.pointer.rect(0, 0, cellSize, cellSize)
    g.pointer.stroke({
      color: 'hsl(240, 50%, 50%)',
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
    state.controller.abort()
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
