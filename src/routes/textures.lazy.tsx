import { createLazyFileRoute } from '@tanstack/react-router'
import { forwardRef, useCallback, useRef } from 'react'
import invariant from 'tiny-invariant'
import { renderSvgToImage, TextureId } from '../textures'

export const Route = createLazyFileRoute('/textures')({
  component: RouteComponent,
})

interface PlainTextureSvgProps {
  color: string
}

const PlainTextureSvg = forwardRef<
  SVGSVGElement,
  PlainTextureSvgProps
>(({ color }, ref) => {
  return (
    <svg
      ref={ref}
      width={100}
      height={100}
      viewBox="0 0 100 100"
    >
      <rect width="100" height="100" fill={color} />
    </svg>
  )
})
PlainTextureSvg.displayName = 'PlainTextureSvg'

interface TextureProps {
  id: TextureId
}

const Texture = forwardRef<SVGSVGElement, TextureProps>(
  ({ id }, ref) => {
    switch (id) {
      case TextureId.enum.NodeNormal:
        return <PlainTextureSvg ref={ref} color="green" />
      case TextureId.enum.NodeConsumer:
        return <PlainTextureSvg ref={ref} color="blue" />
      case TextureId.enum.NodeProducer:
        return <PlainTextureSvg ref={ref} color="red" />
      case TextureId.enum.NodeArrow:
        return (
          <svg
            ref={ref}
            width={100}
            height={100}
            viewBox="0 0 100 100"
          >
            <text
              x="90"
              y="50"
              fontFamily="system-ui"
              fontSize="30"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {'→'}
            </text>
          </svg>
        )
    }
  },
)
Texture.displayName = 'Texture'

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
