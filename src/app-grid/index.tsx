import { uniqueId } from 'lodash-es'
import * as PIXI from 'pixi.js'
import { useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'

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

      const g = initGraphics(app, width, height)

      canvas.addEventListener(
        'pointermove',
        (ev) => {
          g.pointer.position.set(ev.offsetX, ev.offsetY)
        },
        { signal },
      )

      canvas.addEventListener(
        'pointerdown',
        (_ev) => {
          console.log('todo')
        },
        { signal },
      )

      canvas.addEventListener(
        'pointerup',
        (_ev) => {
          console.log('todo')
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
  width: number,
  height: number,
) {
  const g = {
    pointer: new PIXI.Graphics(),
    grid: new PIXI.Graphics(),
  }

  {
    const size = 100
    const cols = Math.ceil(width / size)
    const rows = Math.ceil(height / size)
    g.grid.setStrokeStyle({
      color: 'white',
      width: 1,
    })
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        g.grid
          .moveTo(col * size, 0)
          .lineTo(col * size, height)
          .moveTo(0, row * size)
          .lineTo(width, row * size)
      }
    }
    g.grid.stroke()
    app.stage.addChild(g.grid)
  }

  {
    g.pointer.circle(0, 0, 50)
    g.pointer.fill('red')
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
