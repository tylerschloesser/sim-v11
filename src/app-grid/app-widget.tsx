import clsx from 'clsx'
import React, { useMemo } from 'react'
import { Vec2 } from '../common/vec2'
import { CELL_SIZE } from './const'

export interface AppWidgetProps {
  p: Vec2
  id: string
}

export const AppWidget = React.forwardRef<
  HTMLDivElement,
  AppWidgetProps
  // @ts-expect-error
>(({ id, p }, ref) => {
  const { x: tx, y: ty } = useMemo(
    () => p.mul(CELL_SIZE),
    [p],
  )
  return (
    <div
      ref={ref}
      className={clsx(
        'pointer-events-auto',
        'absolute',
        'border',
      )}
      style={{
        translate: `${tx}px, ${ty}px`,
        width: `${CELL_SIZE * 4}px`,
        height: `${CELL_SIZE * 6}px`,
      }}
    >
      TODO
    </div>
  )
})
