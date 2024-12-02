import { stat } from 'fs'
import { enableMapSet } from 'immer'
import * as PIXI from 'pixi.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import invariant from 'tiny-invariant'
import { useImmer } from 'use-immer'
import { initState, Node, NodeItem, step } from './game'
import { Vec2 } from './vec2'
import { ViewportContainer } from './viewport-container'

enableMapSet()

interface NodeModel {
  id: string
  p: Vec2
}

interface ItemModel {
  id: string
  p: Vec2
}

function CanvasV1({ viewport }: { viewport: Vec2 }) {
  const size = Math.min(viewport.x, viewport.y) / 5

  const [state, setState] = useImmer(initState)

  const { nodes } = state

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    window.addEventListener(
      'keyup',
      (ev) => {
        if (ev.key === 'Enter') {
          setState(step)
        }
      },
      { signal },
    )

    const interval = self.setInterval(() => {
      // setState(step)
    }, 10)

    return () => {
      controller.abort()
      self.clearInterval(interval)
    }
  }, [])

  const nodeModels = useMemo(() => {
    return Array.from(nodes.values()).map(
      (node) =>
        ({
          id: node.id,
          p: new Vec2(node.p.x, node.p.y).add(
            new Vec2(2, 2),
          ),
        }) satisfies NodeModel,
    )
  }, [nodes])

  const itemModels = useMemo(() => {
    return Array.from(nodes.values())
      .filter(
        (node): node is Node & { item: NodeItem } =>
          node.item !== null,
      )
      .map(
        (node) =>
          ({
            id: node.item.id,
            p: new Vec2(node.p.x, node.p.y).add(
              new Vec2(2, 2),
            ),
          }) satisfies ItemModel,
      )
      .sort((a, b) => a.id.localeCompare(b.id))
  }, [nodes])

  return (
    <>
      {nodeModels.map((node) => (
        <div
          key={node.id}
          className="absolute inset-0 border-2 border-white"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            transform: `translate(${node.p.x * size}px, ${node.p.y * size}px)`,
          }}
        >
          {node.id}
        </div>
      ))}
      {itemModels.map((item) => (
        <div
          key={item.id}
          className="absolute inset-0 transition-transform p-4"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            transform: `translate(${item.p.x * size}px, ${item.p.y * size}px)`,
          }}
        >
          <div className="w-full h-full border-2 border-emerald-400">
            {item.id}
          </div>
        </div>
      ))}
    </>
  )
}

function CanvasV2({ viewport }: { viewport: Vec2 }) {
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

export function App() {
  return (
    <div className="p-4 w-dvw h-dvh flex">
      <ViewportContainer className="relative flex-1">
        {(viewport) =>
          viewport ? (
            <>
              <CanvasV2 viewport={viewport} />
              <CanvasV1 viewport={viewport} />
            </>
          ) : null
        }
      </ViewportContainer>
    </div>
  )
}
