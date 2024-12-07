import { z } from 'zod'

export class Vec2 {
  x: number
  y: number
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
  add(v: Vec2) {
    return new Vec2(this.x + v.x, this.y + v.y)
  }
  sub(v: Vec2) {
    return new Vec2(this.x - v.x, this.y - v.y)
  }

  static ZERO = new Vec2(0, 0)
}

export const ZVec2 = z.strictObject({
  x: z.number(),
  y: z.number(),
})
export type ZVec2 = z.infer<typeof ZVec2>
