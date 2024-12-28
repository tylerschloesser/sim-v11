import { z } from 'zod'

export const ItemId = z.string()
export type ItemId = z.infer<typeof ItemId>

export const ItemColor = z.enum(['Green', 'Blue', 'Red'])
export type ItemColor = z.infer<typeof ItemColor>

export const Item = z.strictObject({
  id: z.string(),
  nodeId: z.string(),
  tick: z.number(),
  color: ItemColor,
  purity: z.number().nonnegative().int(),
})
export type Item = z.infer<typeof Item>
