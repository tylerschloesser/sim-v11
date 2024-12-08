import { createLazyFileRoute } from '@tanstack/react-router'
import { TextureId } from '../textures'

export const Route = createLazyFileRoute('/textures')({
  component: RouteComponent,
})

interface PlainTextureSvgProps {
  color: string
}

function PlainTextureSvg({ color }: PlainTextureSvgProps) {
  return (
    <svg width={100} height={100} viewBox="0 0 100 100">
      <rect width="100" height="100" fill={color} />
    </svg>
  )
}

interface TextureProps {
  id: TextureId
}

function Texture({ id }: TextureProps) {
  switch (id) {
    case TextureId.enum.NodeNormal:
      return <PlainTextureSvg color="green" />
    case TextureId.enum.NodeConsumer:
      return <PlainTextureSvg color="blue" />
    case TextureId.enum.NodeProducer:
      return <PlainTextureSvg color="red" />
    case TextureId.enum.NodeArrow:
      return (
        <div className="w-[100px] h-[100px] flex items-center justify-end p-2">
          <span className="text-xl">&rarr;</span>
        </div>
      )
  }
}

interface TextureSectionProps {
  id: TextureId
}

function TextureSection({ id }: TextureSectionProps) {
  return (
    <>
      <div className="flex gap-1">
        <h2>{id}</h2>
        <button className="text-blue-400 underline">
          image
        </button>
      </div>
      <div className="border-2 border-gray-400 flex">
        <Texture id={id} />
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
