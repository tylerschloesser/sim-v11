import clsx from 'clsx'
import React, {
  useCallback,
  useContext,
  useMemo,
} from 'react'
import invariant from 'tiny-invariant'
import { Vec2 } from '../common/vec2'
import {
  Node,
  NodeType,
  ProducerNode,
  PurifierNode,
} from '../game/node'
import { getNode, getNodeWithType } from '../game/util'
import { AppContext } from './app-context'
import { CELL_SIZE } from './const'
import { WidgetProducer } from './widget-producer'

export interface AppWidgetProps {
  p: Vec2
  id: string
}

function useTargetNode(
  widgetNodeId: string,
): [Node | null, (id: string | null) => void] {
  const { game, setGame } = useContext(AppContext)
  const widget = useMemo(
    () =>
      getNodeWithType(
        game,
        widgetNodeId,
        NodeType.enum.FormRoot,
      ),
    [game],
  )

  const target = useMemo(
    () =>
      widget.targetNodeId
        ? getNode(game, widget.targetNodeId)
        : null,
    [game, widget.targetNodeId],
  )

  const setTarget = useCallback(
    (id: string | null) => {
      setGame((draft) => {
        if (id !== null) {
          invariant(draft.nodes[id])
        }
        const node = getNodeWithType(
          draft,
          widgetNodeId,
          NodeType.enum.FormRoot,
        )
        node.targetNodeId = id
      })
    },
    [widgetNodeId],
  )

  return [target, setTarget]
}

export const AppWidget = React.forwardRef<
  HTMLDivElement,
  AppWidgetProps
>(({ id, p }, ref) => {
  const translate = useMemo(() => {
    const { x: tx, y: ty } = p.mul(CELL_SIZE)
    return `${tx}px ${ty}px`
  }, [p])

  const [target, setTarget] = useTargetNode(id)

  const [purifierRate, setPurifierRate] = usePurifierRate()
  return (
    <div
      ref={ref}
      className={clsx(
        'pointer-events-auto',
        'absolute',
        'bg-slate-400',
        'border',
      )}
      style={{
        translate,
        width: `${CELL_SIZE * 4}px`,
        height: `${CELL_SIZE * 6}px`,
      }}
    >
      <ChooseTarget
        id={id}
        target={target}
        setTarget={setTarget}
      />
      {target?.type === NodeType.enum.Producer && (
        <WidgetProducer node={target} />
      )}
      <div>Purifier Rate: {purifierRate ?? '[none]'}</div>
      {purifierRate !== null && (
        <input
          className="block"
          type="range"
          min={0}
          max={1}
          step=".1"
          value={purifierRate}
          onChange={(ev) => {
            setPurifierRate(parseFloat(ev.target.value))
          }}
        />
      )}
    </div>
  )
})

function ChooseTarget({
  id,
  target,
  setTarget,
}: {
  id: string
  target: ReturnType<typeof useTargetNode>[0]
  setTarget: ReturnType<typeof useTargetNode>[1]
}) {
  const { game } = useContext(AppContext)
  const options = useMemo(
    () =>
      Object.values(game.nodes)
        .filter((node) => node.id !== id)
        .filter(isEligibleTarget)
        .map((node) => ({
          value: node.id,
          label: `${node.id} [${node.type}]`,
        })),
    [game.nodes],
  )

  return (
    <select
      className="text-black"
      value={target ? target.id : ''}
      onChange={(ev) => {
        setTarget(ev.target.value || null)
      }}
    >
      <option value="">[none]</option>
      {options.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  )
}

function usePurifierRate(): [
  number | null,
  (value: number) => void,
] {
  const { game, setGame } = useContext(AppContext)
  const rate = useMemo(() => {
    const nodes = Object.values(game.nodes).filter(
      (node) => node.type === NodeType.enum.Purifier,
    )
    if (nodes.length === 0) {
      return null
    }
    const first = nodes.at(0)!
    invariant(
      nodes
        .slice(1)
        .every((node) => node.rate === first.rate),
    )
    return first.rate
  }, [game.nodes])

  const setRate = useCallback(
    (value: number) => {
      setGame((draft) => {
        draft.updateType = null
        const nodes = Object.values(draft.nodes).filter(
          (node) => node.type === NodeType.enum.Purifier,
        )
        invariant(nodes.length > 0)
        for (const node of nodes) {
          node.rate = value
        }
      })
    },
    [setGame],
  )

  return [rate, setRate]
}

function isEligibleTarget(
  node: Node,
): node is ProducerNode | PurifierNode {
  switch (node.type) {
    case NodeType.enum.Producer:
    case NodeType.enum.Purifier:
      return true
    default:
      return false
  }
}
