import { z } from 'zod'
import { ZVec2 } from '../common/vec2'

const NodeId = z.string()

export const NodeType = z.enum([
  'Normal',
  'Consumer',
  'Producer',
  'Purifier',
  'Energizer',
  'FormRoot',
  'FormLeaf',
  'RobotTerminal',
])
export type NodeType = z.infer<typeof NodeType>

export const NodeState = z.enum([
  'PendingConstruction',
  'Active',
  'PendingDestruction',
])
export type NodeState = z.infer<typeof NodeState>

export const OutputDirection = z.enum([
  'North',
  'South',
  'East',
  'West',
])
export type OutputDirection = z.infer<
  typeof OutputDirection
>

const BaseNode = z.strictObject({
  id: NodeId,
  state: NodeState,
  p: ZVec2,
  itemId: z.string().nullable(),
  outputs: z.record(NodeId, OutputDirection),
})

export const NormalNode = BaseNode.extend({
  type: z.literal(NodeType.enum.Normal),
})
export type NormalNode = z.infer<typeof NormalNode>

export const ConsumerNode = BaseNode.extend({
  type: z.literal(NodeType.enum.Consumer),
  stats: z.record(z.string(), z.number()),
})
export type ConsumerNode = z.infer<typeof ConsumerNode>

export const ProducerNode = BaseNode.extend({
  type: z.literal(NodeType.enum.Producer),
  power: z.number().int().nonnegative(),
  rate: z.number().min(0).max(1),
})
export type ProducerNode = z.infer<typeof ProducerNode>

export const PurifierNode = BaseNode.extend({
  type: z.literal(NodeType.enum.Purifier),
  rate: z.number().min(0).max(1),
})
export type PurifierNode = z.infer<typeof PurifierNode>

export const EnergizerNode = BaseNode.extend({
  type: z.literal(NodeType.enum.Energizer),
  power: z.number().int().nonnegative(),
})
export type EnergizerNode = z.infer<typeof EnergizerNode>

export const FormRootNode = BaseNode.extend({
  type: z.literal(NodeType.enum.FormRoot),
  targetNodeId: z.string().nullable(),
})
export type FormRootNode = z.infer<typeof FormRootNode>

export const FormLeafNode = BaseNode.extend({
  type: z.literal(NodeType.enum.FormLeaf),
})
export type FormLeafNode = z.infer<typeof FormLeafNode>

export const RobotTerminalNode = BaseNode.extend({
  type: z.literal(NodeType.enum.RobotTerminal),
  robotId: z.string(),
})
export type RobotTerminalNode = z.infer<
  typeof RobotTerminalNode
>

export const Node = z.union([
  NormalNode,
  ConsumerNode,
  ProducerNode,
  PurifierNode,
  EnergizerNode,
  FormRootNode,
  FormLeafNode,
  RobotTerminalNode,
])
export type Node = z.infer<typeof Node>
