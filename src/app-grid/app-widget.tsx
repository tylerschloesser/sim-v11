import clsx from 'clsx'
import React, { useContext, useMemo } from 'react'
import invariant from 'tiny-invariant'
import { Vec2 } from '../common/vec2'
import { NodeType } from '../game/node'
import { AppContext } from './app-context'
import { CELL_SIZE, DEFAULT_PRODUCER_RATE } from './const'

export interface AppWidgetProps {
  p: Vec2
  id: string
}

export const AppWidget = React.forwardRef<
  HTMLDivElement,
  AppWidgetProps
>(({ id, p }, ref) => {
  const translate = useMemo(() => {
    const { x: tx, y: ty } = p.mul(CELL_SIZE)
    return `${tx}px ${ty}px`
  }, [p])
  const producerRate = useProducerRate()
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
      ID: {id}
      Producer Rate: {producerRate}
    </div>
  )
})

function useProducerRate(): number {
  const { game } = useContext(AppContext)
  return useMemo(() => {
    const nodes = Object.values(game.nodes).filter(
      (node) => node.type === NodeType.enum.Producer,
    )
    if (nodes.length === 0) {
      return DEFAULT_PRODUCER_RATE
    }
    const first = nodes.at(0)!
    invariant(
      nodes
        .slice(1)
        .every((node) => node.rate === first.rate),
    )
    return first.rate
  }, [game.nodes])
}
