import * as PIXI from 'pixi.js'
import { useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'
import { Vec2 } from '../common/vec2'

export function AppGrid() {
  return <>TODO</>
}

export function Canvas({ viewport }: { viewport: Vec2 }) {
  const container = useRef<HTMLDivElement>(null)
  const state = useRef<{
    canvas: HTMLCanvasElement
    app: PIXI.Application
  } | null>(null)

  useEffect(() => {
    invariant(container.current)

    const canvas = document.createElement('canvas')
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.width = viewport.x
    canvas.height = viewport.y

    container.current.appendChild(canvas)

    const app = new PIXI.Application()
    app.init({
      canvas,
      width: canvas.width,
      height: canvas.height,
    })

    state.current = { canvas, app }

    return () => {
      canvas.remove()
      state.current = null
    }
  }, [])

  useEffect(() => {
    if (
      !state.current ||
      (state.current.canvas.width === viewport.x &&
        state.current.canvas.height === viewport.y)
    ) {
      return
    }

    state.current.canvas.width = viewport.x
    state.current.canvas.height = viewport.y
    if (typeof state.current.app.resize === 'function') {
      state.current.app.resize()
    }
  }, [viewport])

  return <div ref={container} className="w-full h-full" />
}
