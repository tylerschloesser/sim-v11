import * as PIXI from 'pixi.js'
import { Vec2 } from '../common/vec2'
import { Robot } from '../game/robot'
import { CELL_SIZE } from './const'

export class RobotContainer extends PIXI.Container {
  private animating: boolean = false
  private robot: Robot
  private readonly g: PIXI.Graphics = new PIXI.Graphics()

  constructor(robot: Robot) {
    super()
    this.robot = robot

    this.g.circle(
      CELL_SIZE / 2,
      CELL_SIZE / 2,
      (CELL_SIZE / 2) * 0.8,
    )
    this.g.fill({ color: 'pink' })

    this.addChild(this.g)

    this.update(robot, true)

    let p = new Vec2(robot.p)
    if (robot.d) {
      // this does not handle animations during initial render
      p = p.sub(new Vec2(robot.d))
    }
    this.position.set(p.x * CELL_SIZE, p.y * CELL_SIZE)
  }

  // @ts-expect-error
  update(robot: Robot, initial: boolean = false): void {
    this.robot = robot
  }

  animate(tickProgress: number): void {
    if (!this.robot.d) {
      if (this.animating) {
        this.position.set(
          this.robot.p.x * CELL_SIZE,
          this.robot.p.y * CELL_SIZE,
        )
        this.animating = false
      }
      return
    }
    this.animating = true
    const d = new Vec2(this.robot.d)
    const p = new Vec2(this.robot.p)
      .sub(d)
      .add(d.mul(tickProgress))
    this.position.set(p.x * CELL_SIZE, p.y * CELL_SIZE)
  }
}
