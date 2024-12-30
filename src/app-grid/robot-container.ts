import * as PIXI from 'pixi.js'
import { Robot } from '../game/robot'
import { CELL_SIZE } from './const'

export class RobotContainer extends PIXI.Container {
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
  }

  update(robot: Robot, initial: boolean = false): void {
    this.robot = robot

    if (initial || this.robot.p !== robot.p) {
      this.position.set(
        robot.p.x * CELL_SIZE,
        robot.p.y * CELL_SIZE,
      )
    }
  }
}
