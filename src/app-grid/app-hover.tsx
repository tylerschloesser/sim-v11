import { useContext, useMemo } from 'react'
import { toNodeId } from '../game/util'
import { AppContext } from './app-context'

export function AppHover() {
  const { view, game } = useContext(AppContext)
  const id = useMemo(
    () => (view.hover ? toNodeId(view.hover.p) : null),
    [view.hover],
  )
  const node = id ? game.nodes[id] : null
  return (
    node && (
      <div>
        <div>{node.type}</div>
        <div>{Object.keys(node.outputs).join(',')}</div>
      </div>
    )
  )
}
