import { createLazyFileRoute } from '@tanstack/react-router'
import { useCallback, useRef } from 'react'
import invariant from 'tiny-invariant'
import { renderSvgToImage, TextureId } from '../textures'
import { Texture } from '../textures/texture'

export const Route = createLazyFileRoute('/textures')({
  component: RouteComponent,
})

interface TextureSectionProps {
  id: TextureId
}

function TextureSection({ id }: TextureSectionProps) {
  const ref = useRef<SVGSVGElement>(null)
  const renderToImage = useCallback(async () => {
    invariant(ref.current)
    const image = await renderSvgToImage(ref.current)

    const link = document.createElement('a')
    link.href = image
    link.download = `${id}.png`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])
  return (
    <>
      <div className="flex gap-1">
        <h2>{id}</h2>
        <button
          className="text-blue-400 underline"
          onClick={renderToImage}
        >
          image
        </button>
      </div>
      <div className="border-2 border-gray-400 flex">
        <Texture id={id} ref={ref} />
      </div>
    </>
  )
}

function RouteComponent() {
  return (
    <div className="flex flex-col items-start">
      {[
        TextureId.options.map((id) => (
          <TextureSection key={id} id={id} />
        )),
      ]}
    </div>
  )
}
