import { Vec2 } from '../common/vec2'
import { NodeType } from '../game/node'

export enum AppViewType {
  Home = 'home',
  AddNode = 'add-node',
  AddForm = 'add-form',
}

export interface AppView {
  type: AppViewType
  nodeType: NodeType
  hover: Vec2 | null
}
