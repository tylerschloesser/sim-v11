import { Vec2 } from '../common/vec2'
import { NodeType } from '../game'

export interface InputView {
  pointer: Vec2 | null
}

export interface Input {
  nodeType: NodeType
  hoverCell: Vec2 | null
}
