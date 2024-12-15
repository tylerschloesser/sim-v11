import * as PIXI from 'pixi.js'
import { InputView } from '../app-graph/input-view'
import { TextureId } from '../textures'
import { GameView } from './game-view'

export interface Graphics {
  pointer: PIXI.Graphics
  grid: PIXI.Graphics
  world: PIXI.Container
  nodes: Map<string, PIXI.Container>
  items: Map<string, PIXI.Graphics>
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

  inputViewPrev: InputView
  inputViewNext: InputView
}
