import { z } from 'zod'

export const JobType = z.enum(['Construct'])
export type JobType = z.infer<typeof JobType>

export const Job = z.strictObject({
  id: z.string(),
  type: JobType,
  nodeId: z.string(),
  robotId: z.string().nullable(),
})
export type Job = z.infer<typeof Job>
