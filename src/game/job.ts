import { z } from 'zod'

export const JobType = z.enum(['Construct', 'Destroy'])
export type JobType = z.infer<typeof JobType>

export const BaseJob = z.strictObject({
  id: z.string(),
  nodeId: z.string(),
  robotId: z.string().nullable(),
})

export const ConstructJob = BaseJob.extend({
  type: z.literal(JobType.enum.Construct),
})
export type ConstructJob = z.infer<typeof ConstructJob>

export const DestroyJob = BaseJob.extend({
  type: z.literal(JobType.enum.Destroy),
})
export type DestroyJob = z.infer<typeof DestroyJob>

export const Job = z.discriminatedUnion('type', [
  ConstructJob,
  DestroyJob,
])
export type Job = z.infer<typeof Job>
