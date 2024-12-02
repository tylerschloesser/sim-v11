import clsx from 'clsx'
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
  arrows: (0 | 90 | 180 | 270)[]
}

interface ItemModel {
  id: string
  p: Vec2
}

function radiansToDegrees(radians: number) {
  return (radians * 180) / Math.PI
}

function CanvasV1({ viewport }: { viewport: Vec2 }) {
  const size = Math.min(viewport.x, viewport.y) / 5

  const [state, setState] = useImmer(initState)

  const { nodes } = state

  const [active, setActive] = useState(false)

  useEffect(() => {
    function listener(ev: KeyboardEvent) {
      if (ev.key === 'Enter') {
        setActive(ev.type === 'keydown')
      }
    }
    window.addEventListener('keyup', listener)
    window.addEventListener('keydown', listener)
    return () => {
      window.removeEventListener('keyup', listener)
      window.removeEventListener('keydown', listener)
    }
  }, [])

  useEffect(() => {
    if (!active) return
    const interval = self.setInterval(() => {
      setState(step)
    }, 100)
    return () => {
      self.clearInterval(interval)
    }
  }, [active])

  const nodeModels = useMemo(() => {
    function refToNode({ id }: { id: string }) {
      const node = nodes.get(id)
      invariant(node)
      return node
    }
    return Array.from(nodes.values()).map(
      (node) =>
        ({
          id: node.id,
          p: new Vec2(node.p.x, node.p.y),
          arrows: node.outputs
            .map(refToNode)
            .map((output) => {
              const dx = output.p.x - node.p.x
              const dy = output.p.y - node.p.y
              let angle = radiansToDegrees(
                Math.atan2(dy, dx),
              )
              angle = (angle + 360) % 360
              switch (angle) {
                case 0:
                case 90:
                case 180:
                case 270:
                  return angle
                default:
                  invariant(false)
              }
            }),
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
            p: new Vec2(node.p.x, node.p.y),
          }) satisfies ItemModel,
      )
      .sort((a, b) => a.id.localeCompare(b.id))
  }, [nodes])

  return (
    <>
      {nodeModels.map((node) => (
        <div
          key={node.id}
          className="absolute inset-0"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            transform: `translate(${node.p.x * size}px, ${node.p.y * size}px)`,
          }}
        >
          <div className="w-full h-full border-2 border-white">
            {node.id}
          </div>
          {node.arrows.map((rotate) => (
            <div
              key={rotate}
              className={clsx(
                'absolute inset-0 flex items-center justify-end',
                rotate === 0 && 'rotate-0',
                rotate === 90 && 'rotate-90',
                rotate === 180 && 'rotate-180',
                rotate === 270 && '-rotate-90',
              )}
            >
              &rarr;
            </div>
          ))}
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
              {/*
              <CanvasV2 viewport={viewport} />
                */}
              <CanvasV1 viewport={viewport} />
            </>
          ) : null
        }
      </ViewportContainer>
    </div>
  )
}
