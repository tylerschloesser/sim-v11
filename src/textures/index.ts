import { z } from 'zod'

export const TextureId = z.enum([
  'NodeNormal',
  'NodeConsumer',
  'NodeProducer',
])
export type TextureId = z.infer<typeof TextureId>

export function renderTexture(
  id: TextureId,
  context: CanvasRenderingContext2D,
) {
  switch (id) {
    case TextureId.enum.NodeNormal:
      context.fillStyle = 'green'
      context.fillRect(0, 0, 100, 100)
      break
    case TextureId.enum.NodeConsumer:
      context.fillStyle = 'blue'
      context.fillRect(0, 0, 100, 100)
      break
    case TextureId.enum.NodeProducer:
      context.fillStyle = 'red'
      context.fillRect(0, 0, 100, 100)
      break
  }
}
