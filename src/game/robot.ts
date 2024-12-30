import { z } from 'zod'
import { ZVec2 } from '../common/vec2'

export const Robot = z.strictObject({
  id: z.string(),
  p: ZVec2,
})
export type Robot = z.infer<typeof Robot>