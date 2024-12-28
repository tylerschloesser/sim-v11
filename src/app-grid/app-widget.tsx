import React from 'react'

export interface AppWidgetProps {
  id: string
}

export const AppWidget = React.forwardRef<
  HTMLDivElement,
  AppWidgetProps
  // @ts-expect-error
>(({ id }, ref) => {
  return (
    <div ref={ref} className="pointer-events-auto">
      TODO
    </div>
  )
})
