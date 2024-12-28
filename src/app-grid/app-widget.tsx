export interface AppWidgetProps {
  id: string
}

// @ts-expect-error
export function AppWidget({ id }: AppWidgetProps) {
  return <>TODO</>
}
