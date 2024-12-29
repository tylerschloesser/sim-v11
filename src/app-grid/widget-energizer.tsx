import { EnergizerNode } from '../game/node'

export interface WidgetEnergizerProps {
  node: EnergizerNode
}

export function WidgetEnergizer({
  node,
}: WidgetEnergizerProps) {
  return <div>TODO {node.id}</div>
}
