import { NodeType } from '../game/node'
import { Hover } from './hover'

export enum AppViewType {
  Home = 'home',
  AddNode = 'add-node',
  AddForm = 'add-form',
}

export interface AppView {
  type: AppViewType
  nodeType: NodeType
  hover: Hover | null
  widgets: Map<string, Widget>
}

export interface Widget {
  id: string
}
