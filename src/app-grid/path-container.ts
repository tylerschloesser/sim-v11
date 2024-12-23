import * as PIXI from 'pixi.js'
import { Path } from './path'

export class PathContainer extends PIXI.Container {
  constructor() {
    super()
  }

  // @ts-expect-error
  public update(path: Path | null): void {}
}
