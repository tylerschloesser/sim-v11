import { z } from 'zod'
import { ZVec2 } from '../common/vec2'

export const NodeRef = z.strictObject({
  id: z.string(),
})
export type NodeRef = z.infer<typeof NodeRef>

export const ItemColor = z.enum(['Green', 'Blue', 'Red'])
export type ItemColor = z.infer<typeof ItemColor>

export const NodeItem = z.strictObject({
  id: z.string(),
  tick: z.number(),
  color: ItemColor,
  purity: z.number().min(0).max(1),
})
export type NodeItem = z.infer<typeof NodeItem>

export const NodeType = z.enum([
  'Normal',
  'Consumer',
  'Producer',
  'Purifier',
])
export type NodeType = z.infer<typeof NodeType>

const BaseNode = z.strictObject({
  id: z.string(),
  type: NodeType,
  p: ZVec2,
  item: NodeItem.nullable(),
  outputs: NodeRef.array(),
})

export const NormalNode = BaseNode.extend({
  type: z.literal(NodeType.enum.Normal),
})
export type NormalNode = z.infer<typeof NormalNode>

export const ConsumerNode = BaseNode.extend({
  type: z.literal(NodeType.enum.Consumer),
})
export type ConsumerNode = z.infer<typeof ConsumerNode>

export const ProducerNode = BaseNode.extend({
  type: z.literal(NodeType.enum.Producer),
  rate: z.number().min(0).max(1),
})
export type ProducerNode = z.infer<typeof ProducerNode>

export const PurifierNode = BaseNode.extend({
  type: z.literal(NodeType.enum.Purifier),
  rate: z.number().min(0).max(1),
})
export type PurifierNode = z.infer<typeof PurifierNode>

export const Node = z.union([
  NormalNode,
  ConsumerNode,
  ProducerNode,
  PurifierNode,
])
export type Node = z.infer<typeof Node>
