import { z } from 'zod'
import { Item } from './item'
import { Job } from './job'
import { Node } from './node'
import { Robot } from './robot'

export const UpdateType = z.enum(['Tick'])
export type UpdateType = z.infer<typeof UpdateType>

export const Game = z
  .strictObject({
    tick: z.number(),
    updateType: UpdateType.nullable(),
    nodes: z.record(z.string(), Node),

    items: z.record(z.string(), Item),
    nextItemId: z.number(),

    robots: z.record(z.string(), Robot),
    nextRobotId: z.number(),

    jobs: z.record(z.string(), Job),
    nextJobId: z.number(),
  })
  .superRefine((game, context) => {
    const seen = new Set<string>()
    const extra = new Set(Object.keys(game.items))
    for (const node of Object.values(game.nodes)) {
      if (node.itemId === null) {
        continue
      }
      extra.delete(node.itemId)
      if (seen.has(node.itemId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate item [id=${node.itemId}][nodeId=${node.id}]`,
        })
      }
      seen.add(node.itemId)

      const item = game.items[node.itemId]
      if (!item) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Missing item [id=${node.itemId}][nodeId=${node.id}]`,
        })
      }
    }

    for (const id of extra) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Extra item [id=${id}]`,
      })
    }
  })

export type Game = z.infer<typeof Game>
