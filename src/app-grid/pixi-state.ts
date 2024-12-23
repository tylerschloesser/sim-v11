import * as PIXI from 'pixi.js'
import { Subscription } from 'rxjs'
import { TextureId } from '../textures'
import { GameView, NodeView } from './game-view'
import { PathContainer } from './path-container'

export class NodeContainer extends PIXI.Container {
  ref: NodeView
  constructor(ref: NodeView) {
    super()
    this.ref = ref
  }
}

export interface Graphics {
  pointer: PIXI.Graphics
  grid: PIXI.Graphics
  world: PIXI.Container
  nodes: Map<string, NodeContainer>
  items: Map<string, PIXI.Graphics>
  path: PathContainer
}

export interface PixiState {
  id: string
  canvas: HTMLCanvasElement
  app: PIXI.Application
  ro: ResizeObserver
  controller: AbortController
  g: Graphics
  textures: Record<TextureId, PIXI.Texture>
  frameHandle: number

  lastTickTime: number | null
  viewPrev: GameView | null
  viewNext: GameView | null

  sub: Subscription
}
