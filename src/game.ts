import { z } from 'zod'
import { ZVec2 } from './vec2'

const NodeRef = z.strictObject({
  id: z.string(),
})

const NodeItem = z.strictObject({
  tick: z.number(),
})

const Node = z.strictObject({
  id: z.string(),
  p: ZVec2,
  item: NodeItem.nullable(),
  out: NodeRef.array(),
})
