import { Vec2 } from '../common/vec2'

export enum PointerType {
  Free = 'free',
  Drag = 'drag',
  Path = 'path',
  Select = 'select',
}

export interface FreePointer {
  type: PointerType.Free
  p: Vec2
}

export interface DragPointer {
  type: PointerType.Drag
  p: Vec2
  down: { t: number; p: Vec2 }
  delta: Vec2
}

export interface PathPointer {
  type: PointerType.Path
  p: Vec2
  down: { t: number; p: Vec2 }
}

export interface SelectPointer {
  type: PointerType.Select
  p: Vec2
  down: { t: number; p: Vec2 }
}

export type Pointer =
  | FreePointer
  | DragPointer
  | PathPointer
  | SelectPointer
