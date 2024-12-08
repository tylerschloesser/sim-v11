import { createLazyFileRoute } from '@tanstack/react-router'
import { forwardRef, useCallback, useRef } from 'react'
import invariant from 'tiny-invariant'
import { TextureId } from '../textures'

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
          <div className="w-[100px] h-[100px] flex items-center justify-end p-2">
            <span className="text-xl">&rarr;</span>
          </div>
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
  const renderToImage = useCallback(() => {
    invariant(ref.current)
    console.log('todo')
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
