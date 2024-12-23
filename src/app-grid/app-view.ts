import { Vec2 } from '../common/vec2'
import { NodeType } from '../game/node'

export enum AppViewType {
  Home = 'home',
  AddNode = 'add-node',
}

export interface AppView {
  type: AppViewType
  nodeType: NodeType
  hover: Vec2 | null
}
