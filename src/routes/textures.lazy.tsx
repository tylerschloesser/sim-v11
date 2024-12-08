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

    const svgString = new XMLSerializer().serializeToString(
      ref.current,
    )
    const svgBlob = new Blob([svgString], {
      type: 'image/svg+xml;charset=utf-8',
    })
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 100
      canvas.height = 100
      const context = canvas.getContext('2d')
      invariant(context)
      context.drawImage(img, 0, 0)

      const imgBlob = canvas.toDataURL('image/png')

      const link = document.createElement('a')
      link.href = imgBlob
      link.download = `${id}.png`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    img.src = url
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
