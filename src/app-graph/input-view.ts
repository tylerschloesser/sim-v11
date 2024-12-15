import { Vec2 } from '../common/vec2'

export interface InputView {
  pointer: Vec2 | null
}

export interface Input {
  hoverCell: Vec2 | null
}
