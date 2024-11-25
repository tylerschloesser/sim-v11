import { Application } from 'pixi.js'
import { useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'

export function App() {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    invariant(container.current)

    const canvas = document.createElement('canvas')
    container.current.appendChild(canvas)

    const app = new Application()
    app.init({ canvas }).then(() => {
      console.log('after init!')
    })

    return () => {
      canvas.remove()
    }
  }, [])
  return <div ref={container} />
}
