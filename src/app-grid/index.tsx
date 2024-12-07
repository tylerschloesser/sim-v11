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

      resolve({ id, canvas, app, ro })
    },
  )
  cache.set(id, promise)
  return promise
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
