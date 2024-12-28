import { ConsumerNode } from '../game/node'

export interface WidgetConsumerProps {
  node: ConsumerNode
}
// @ts-expect-error
export function WidgetConsumer({
  node,
}: WidgetConsumerProps) {
  return <div>TODO</div>
}
