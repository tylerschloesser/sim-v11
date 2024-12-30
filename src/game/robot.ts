import { z } from 'zod'

export const Robot = z.strictObject({
  id: z.string(),
})
export type Robot = z.infer<typeof Robot>
