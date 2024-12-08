import { createLazyFileRoute } from '@tanstack/react-router'
import { Fragment, useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'
import { renderTexture, TextureId } from '../textures'

export const Route = createLazyFileRoute('/textures')({
  component: RouteComponent,
})

interface TextureCanvasProps {
  id: TextureId
}
function TextureCanvas({ id }: TextureCanvasProps) {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    invariant(canvas.current)
    const context = canvas.current.getContext('2d')
    invariant(context)
    renderTexture(id, context)
  }, [id])

  return <canvas ref={canvas} width={100} height={100} />
}

function RouteComponent() {
  return (
    <div>
      {[
        TextureId.options.map((id) => (
          <Fragment key={id}>
            <h2>{id}</h2>
            <TextureCanvas id={id} />
          </Fragment>
        )),
      ]}
    </div>
  )
}
