import { useCallback, useContext } from 'react'
import { NodeType, ProducerNode } from '../game/node'
import { getNodeWithType } from '../game/util'
import { AppContext } from './app-context'

export interface WidgetProducerProps {
  node: ProducerNode
}

export function WidgetProducer({
  node,
}: WidgetProducerProps) {
  const [rate, setRate] = useRate(node)
  return (
    <div>
      <div>Power: {node.power}</div>
      <div>Rate: {rate ?? '[none]'}</div>
      {rate !== null && (
        <input
          className="block"
          type="range"
          min={0}
          max={1}
          step=".1"
          value={rate}
          onChange={(ev) => {
            setRate(parseFloat(ev.target.value))
          }}
        />
      )}
    </div>
  )
}

function useRate(
  node: ProducerNode,
): [number | null, (value: number) => void] {
  return [node.rate, useSetRate(node.id)]
}

function useSetRate(
  nodeId: string,
): (value: number) => void {
  const { setGame } = useContext(AppContext)
  return useCallback(
    (value: number) => {
      setGame((draft) => {
        const node = getNodeWithType(
          draft,
          nodeId,
          NodeType.enum.Producer,
        )
        node.rate = value
      })
    },
    [nodeId],
  )
}
