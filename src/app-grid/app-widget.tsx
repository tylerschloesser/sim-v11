import clsx from 'clsx'
import React, {
  useCallback,
  useContext,
  useMemo,
} from 'react'
import invariant from 'tiny-invariant'
import { Vec2 } from '../common/vec2'
import { NodeType } from '../game/node'
import { AppContext } from './app-context'
import { CELL_SIZE } from './const'

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
  const [producerRate, setProducerRate] = useProducerRate()
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
      <div>ID: {id}</div>
      <div>Producer Rate: {producerRate ?? '[none]'}</div>
      {producerRate !== null && (
        <input
          className="block"
          type="range"
          min={0}
          max={1}
          step=".1"
          value={producerRate}
          onChange={(ev) => {
            setProducerRate(parseFloat(ev.target.value))
          }}
        />
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

function useProducerRate(): [
  number | null,
  (value: number) => void,
] {
  const { game, setGame } = useContext(AppContext)
  const rate = useMemo(() => {
    const nodes = Object.values(game.nodes).filter(
      (node) => node.type === NodeType.enum.Producer,
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
          (node) => node.type === NodeType.enum.Producer,
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
