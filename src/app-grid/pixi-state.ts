import * as PIXI from 'pixi.js'
import { Subscription } from 'rxjs'
import { TextureId } from '../textures'
import { ItemContainer } from './item-container'
import { NodeContainer } from './node-container'
import { PathContainer } from './path-container'
import { PointerContainer } from './pointer-container'
import { RobotContainer } from './robot-container'

export interface Graphics {
  pointer: PointerContainer
  grid: PIXI.Graphics
  world: PIXI.Container
  nodes: Map<string, NodeContainer>
  items: Map<string, ItemContainer>
  robots: Map<string, RobotContainer>
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

  sub: Subscription
}
