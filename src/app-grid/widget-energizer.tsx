import { EnergizerNode } from '../game/node'

export interface WidgetEnergizerProps {
  node: EnergizerNode
}

export function WidgetEnergizer({
  node,
}: WidgetEnergizerProps) {
  return <div>Power: {node.power}</div>
}
