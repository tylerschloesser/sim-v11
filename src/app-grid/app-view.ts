import { Vec2 } from '../common/vec2'
import { NodeType } from '../game'

export interface AppView {
  nodeType: NodeType
  hover: Vec2 | null
}
