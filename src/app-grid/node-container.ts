import * as PIXI from 'pixi.js'
import invariant from 'tiny-invariant'
import {
  Node,
  NodeState,
  NodeType,
  OutputDirection,
} from '../game/node'
import { TextureId } from '../textures'
import { CELL_SIZE } from './const'
import { PixiState } from './pixi-state'

export class NodeContainer extends PIXI.Container {
  private node: Node
  private state: PixiState
  private arrows: PIXI.Container = new PIXI.Container()

  constructor(node: Node, state: PixiState) {
    super()
    this.node = node
    this.state = state

    this.position.set(
      node.p.x * CELL_SIZE,
      node.p.y * CELL_SIZE,
    )

    {
      const texture = state.textures[nodeTextureId(node)]
      const sprite = new PIXI.Sprite(texture)
      sprite.width = CELL_SIZE
      sprite.height = CELL_SIZE

      this.addChild(sprite)
    }

    this.addChild(this.arrows)

    this.update(node, true)
  }

  update(node: Node, initial: boolean = false): void {
    invariant(this.node.id === node.id)
    invariant(this.node.type === node.type)
    invariant(this.node.p === node.p)

    if (initial || this.node.state !== node.state) {
      this.updateState(node)
    }

    if (initial || this.node.outputs !== node.outputs) {
      this.updateOutputs(node)
    }

    this.node = node
  }

  updateState(node: Node): void {
    if (node.state === NodeState.enum.PendingConstruction) {
      this.alpha = 0.5
    } else {
      this.alpha = 1
    }
  }

  updateOutputs(node: Node): void {
    this.arrows.removeChildren()
    const texture =
      this.state.textures[TextureId.enum.NodeArrow]
    for (const direction of Object.values(node.outputs)) {
      const sprite = new PIXI.Sprite(texture)
      sprite.anchor.set(0.5)
      sprite.position.set(CELL_SIZE / 2)
      sprite.width = CELL_SIZE
      sprite.height = CELL_SIZE
      sprite.alpha = 0.8
      switch (direction) {
        case OutputDirection.enum.North:
          sprite.angle = -90
          break
        case OutputDirection.enum.South:
          sprite.angle = 90
          break
        case OutputDirection.enum.East:
          // default angle
          break
        case OutputDirection.enum.West:
          sprite.angle = 180
          break
      }
      this.arrows.addChild(sprite)
    }
  }
}

function nodeTextureId(node: Node): TextureId {
  switch (node.type) {
    case NodeType.enum.Normal:
      return TextureId.enum.NodeNormal
    case NodeType.enum.Consumer:
      return TextureId.enum.NodeConsumer
    case NodeType.enum.Producer:
      return TextureId.enum.NodeProducer
    case NodeType.enum.Purifier:
      return TextureId.enum.NodePurifier
    case NodeType.enum.Energizer:
      return TextureId.enum.NodeEnergizer
    case NodeType.enum.FormRoot:
      return TextureId.enum.NodeFormRoot
    case NodeType.enum.RobotTerminal:
      return TextureId.enum.NodeRobotTerminal
    case NodeType.enum.FormLeaf:
      return TextureId.enum.NodeFormLeaf
  }
}
