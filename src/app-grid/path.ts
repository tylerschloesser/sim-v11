import { Vec2 } from '../common/vec2'

export interface Path {
  start: 'x' | 'y' | null
  first: Vec2
  last: Vec2
}
