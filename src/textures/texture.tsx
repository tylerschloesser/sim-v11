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
    case TextureId.enum.NodePurifier:
      return (
        <PlainTextureSvg
          ref={ref}
          color="magenta"
          textureId={id}
        />
      )
    case TextureId.enum.NodeEnergizer:
      return (
        <PlainTextureSvg
          ref={ref}
          color="hsl(20, 80%, 60%)"
          textureId={id}
        />
      )
    case TextureId.enum.NodeFormRoot:
      return (
        <PlainTextureSvg
          ref={ref}
          color="hsl(60, 80%, 60%)"
          textureId={id}
        />
      )
    case TextureId.enum.NodeFormLeaf:
      return (
        <PlainTextureSvg
          ref={ref}
          color="hsl(60, 20%, 40%)"
          textureId={id}
        />
      )
    case TextureId.enum.NodeRobotTerminal:
      return (
        <PlainTextureSvg
          ref={ref}
          color="hsl(160, 30%, 50%)"
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
          <g
            strokeWidth="4"
            stroke="white"
            strokeLinecap="round"
          >
            <line x1="70" y1="50" x2="90" y2="50" />
            <line x1="80" y1="40" x2="90" y2="50" />
            <line x1="80" y1="60" x2="90" y2="50" />
          </g>
        </svg>
      )
  }
})
Texture.displayName = 'Texture'
