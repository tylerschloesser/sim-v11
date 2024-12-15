import invariant from 'tiny-invariant'
import { z } from 'zod'

export class Vec2 {
  readonly x: number
  readonly y: number
  constructor(x: number, y: number)
  constructor(x: ZVec2)
  constructor(x: number | ZVec2, y?: number) {
    if (typeof x === 'number') {
      invariant(typeof y === 'number')
      this.x = x
      this.y = y
    } else {
      this.x = x.x
      this.y = x.y
    }
  }
  add(v: Vec2) {
    return new Vec2(this.x + v.x, this.y + v.y)
  }
  sub(v: Vec2) {
    return new Vec2(this.x - v.x, this.y - v.y)
  }
  mul(s: number) {
    return new Vec2(this.x * s, this.y * s)
  }
  div(s: number) {
    invariant(s !== 0)
    return new Vec2(this.x / s, this.y / s)
  }
  floor() {
    return new Vec2(Math.floor(this.x), Math.floor(this.y))
  }
  equals(v: Vec2): boolean {
    return this.x === v.x && this.y === v.y
  }
  static ZERO = new Vec2(0, 0)
}

export const ZVec2 = z.strictObject({
  x: z.number(),
  y: z.number(),
})
export type ZVec2 = z.infer<typeof ZVec2>
