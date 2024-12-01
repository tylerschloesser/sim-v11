import { z } from 'zod'
import { ZVec2 } from './vec2'

export const NodeRef = z.strictObject({
  id: z.string(),
})
export type NodeRef = z.infer<typeof NodeRef>

export const NodeItem = z.strictObject({
  tick: z.number(),
})
export type NodeItem = z.infer<typeof NodeItem>

export const Node = z.strictObject({
  id: z.string(),
  p: ZVec2,
  item: NodeItem.nullable(),
  out: NodeRef.array(),
})
export type Node = z.infer<typeof Node>

const nodes = new Map<string, Node>()

;(
  [
    {
      id: '0',
      p: { x: 0, y: 0 },
      item: { tick: 0 },
      out: [{ id: '1' }],
    },
    {
      id: '1',
      p: { x: 1, y: 0 },
      item: null,
      out: [{ id: '2' }],
    },
    {
      id: '2',
      p: { x: 1, y: 1 },
      item: null,
      out: [{ id: '3' }],
    },
    {
      id: '3',
      p: { x: 0, y: 1 },
      item: null,
      out: [{ id: '0' }],
    },
  ] satisfies Node[]
).forEach((node) => {
  nodes.set(node.id, node)
})
