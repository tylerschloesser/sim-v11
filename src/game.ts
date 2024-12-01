import { z } from 'zod'
import { ZVec2 } from './vec2'

const NodeRef = z.strictObject({
  id: z.string(),
})
type NodeRef = z.infer<typeof NodeRef>

const NodeItem = z.strictObject({
  tick: z.number(),
})
type NodeItem = z.infer<typeof NodeItem>

const Node = z.strictObject({
  id: z.string(),
  p: ZVec2,
  item: NodeItem.nullable(),
  out: NodeRef.array(),
})
type Node = z.infer<typeof Node>
