import { z } from 'zod'
import { ZVec2 } from '../common/vec2'

export const Robot = z.strictObject({
  id: z.string(),
  nodeId: z.string(),
  p: ZVec2,
  d: ZVec2.nullable(),
  jobId: z.string().nullable(),
})
export type Robot = z.infer<typeof Robot>
