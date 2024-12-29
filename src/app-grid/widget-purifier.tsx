import { useCallback, useContext, useMemo } from 'react'
import invariant from 'tiny-invariant'
import { Item } from '../game/item'
import { NodeType, PurifierNode } from '../game/node'
import { getNodeWithType } from '../game/util'
import { AppContext } from './app-context'

export interface WidgetPurifierProps {
  node: PurifierNode
}

export function WidgetPurifier({
  node,
}: WidgetPurifierProps) {
  const [rate, setRate] = useRate(node)
  const item = useItem(node)
  return (
    <div>
      <div>
        Item Purity: {item ? item.purity : '[none]'}
      </div>
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
  node: PurifierNode,
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
          NodeType.enum.Purifier,
        )
        node.rate = value
      })
    },
    [nodeId],
  )
}

function useItem(node: PurifierNode): Item | null {
  const { game } = useContext(AppContext)
  return useMemo(() => {
    if (!node.itemId) {
      return null
    }
    const item = game.items[node.itemId]
    invariant(item)
    return item
  }, [game.items, node.itemId])
}
