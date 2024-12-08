import { z } from 'zod'

export const TextureId = z.enum([
  'NodeNormal',
  'NodeConsumer',
  'NodeProducer',
  'NodeArrow',
])
export type TextureId = z.infer<typeof TextureId>
