import { forwardRef } from 'react'
import { TextureId } from '../textures'

interface PlainTextureSvgProps {
  color: string
  textureId: TextureId
}

const PlainTextureSvg = forwardRef<
  SVGSVGElement,
  PlainTextureSvgProps
>(({ color, textureId }, ref) => {
  return (
    <svg
      data-texture-id={textureId}
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

export interface TextureProps {
  id: TextureId
}

export const Texture = forwardRef<
  SVGSVGElement,
  TextureProps
>(({ id }, ref) => {
  switch (id) {
    case TextureId.enum.NodeNormal:
      return (
        <PlainTextureSvg
          ref={ref}
          color="green"
          textureId={id}
        />
      )
    case TextureId.enum.NodeConsumer:
      return (
        <PlainTextureSvg
          ref={ref}
          color="blue"
          textureId={id}
        />
      )
    case TextureId.enum.NodeProducer:
      return (
        <PlainTextureSvg
          ref={ref}
          color="red"
          textureId={id}
        />
      )
    case TextureId.enum.NodeArrow:
      return (
        <svg
          data-texture-id={id}
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
            fill="pink"
          >
            {'→'}
          </text>
        </svg>
      )
  }
})
Texture.displayName = 'Texture'
