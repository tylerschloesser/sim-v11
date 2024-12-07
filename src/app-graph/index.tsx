import clsx from 'clsx'
import { sample } from 'lodash-es'
import { useCallback, useEffect, useMemo } from 'react'
import invariant from 'tiny-invariant'
import { useImmer } from 'use-immer'
import {
  initState,
  Node,
  NodeColor,
  NodeItem,
  NodeType,
  step,
} from './game'
import { Vec2 } from './vec2'
import { ViewportContainer } from './viewport-container'

export function AppGraph() {
  return (
    <div className="p-4 w-dvw h-dvh flex">
      <ViewportContainer className="relative flex-1">
        {(viewport) =>
          viewport ? <CanvasV1 viewport={viewport} /> : null
        }
      </ViewportContainer>
    </div>
  )
}

interface NodeModel {
  id: string
  type: NodeType
  p: Vec2
  arrows: (0 | 90 | 180 | 270)[]
}

interface ItemModel {
  id: string
  p: Vec2
  color: NodeColor
}

function radiansToDegrees(radians: number) {
  return (radians * 180) / Math.PI
}

function CanvasV1({ viewport }: { viewport: Vec2 }) {
  const size = Math.min(viewport.x, viewport.y) / 5

  const [state, setState] = useImmer(initState)

  const { nodes } = state

  const [active, setActive] = useImmer<{
    value: boolean
    once: boolean
  }>({ value: false, once: false })

  useEffect(() => {
    function listener(ev: KeyboardEvent) {
      if (ev.key === 'Enter') {
        setActive((draft) => {
          draft.value = ev.type === 'keydown'
          draft.once =
            ev.type === 'keydown' ? false : draft.once
        })
      } else if (ev.key === 'a' && ev.type === 'keyup') {
        setActive((draft) => {
          draft.value = !draft.value
          draft.once = true
        })
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
    if (!active.value) {
      if (!active.once) {
        setState(step)
      }
      return
    }
    const interval = self.setInterval(() => {
      setState(step)
      setActive((draft) => {
        draft.once = true
      })
    }, 150)
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
          type: node.type,
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
            color: node.item.color,
          }) satisfies ItemModel,
      )
      .sort((a, b) => a.id.localeCompare(b.id))
  }, [nodes])

  const onClickNode = useCallback((id: string) => {
    setState((draft) => {
      const node = draft.nodes.get(id)
      invariant(node)
      if (node.item === null) {
        node.item = {
          id: `${draft.nextItemId++}`,
          tick: 0,
          color: sample(NodeColor.options),
        }
      }
    })
  }, [])

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
          onClick={() => onClickNode(node.id)}
        >
          <div
            className={clsx(
              'w-full h-full border-2',
              node.type === NodeType.enum.Normal &&
                'border-white',
              node.type === NodeType.enum.Consumer &&
                'border-red-400',
              node.type === NodeType.enum.Producer &&
                'border-green-400',
            )}
          >
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
          className="absolute inset-0 transition-transform ease-linear p-4"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            transform: `translate(${item.p.x * size}px, ${item.p.y * size}px)`,
          }}
        >
          <div
            className={clsx(
              'w-full h-full border-2',
              item.color === NodeColor.enum.Green &&
                'border-emerald-400',
              item.color === NodeColor.enum.Blue &&
                'border-blue-400',
              item.color === NodeColor.enum.Red &&
                'border-red-400',
            )}
          >
            {item.id}
          </div>
        </div>
      ))}
    </>
  )
}
