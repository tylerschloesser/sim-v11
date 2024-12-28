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
>(({ id, p }, ref) => {
  const translate = useMemo(() => {
    const { x: tx, y: ty } = p.mul(CELL_SIZE)
    return `${tx}px ${ty}px`
  }, [p])
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
    </div>
  )
})
