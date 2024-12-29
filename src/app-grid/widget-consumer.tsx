import { Fragment } from 'react/jsx-runtime'
import { ConsumerNode } from '../game/node'

export interface WidgetConsumerProps {
  node: ConsumerNode
}
export function WidgetConsumer({
  node,
}: WidgetConsumerProps) {
  return (
    <div className="grid grid-cols-[max-content_1fr] gap-1 font-mono">
      {Object.entries(node.stats).map(([key, value]) => (
        <Fragment key={key}>
          <span>{key}</span>
          <span>{value}</span>
        </Fragment>
      ))}
    </div>
  )
}
