import * as PIXI from 'pixi.js'
import { NodeState } from '../game/node'
import { TextureId } from '../textures'
import { CELL_SIZE } from './const'
import { NodeView } from './game-view'
import { NodeContainer, PixiState } from './pixi-state'

export function renderNode(
  node: NodeView,
  state: PixiState,
) {
  let container = state.g.nodes.get(node.id)
  if (container?.ref === node) {
    return
  }
  container?.destroy({ children: true })

  container = new NodeContainer(node)
  if (node.state === NodeState.enum.PendingConstruction) {
    container.alpha = 0.5
  }

  container.position.set(
    node.p.x * CELL_SIZE,
    node.p.y * CELL_SIZE,
  )

  state.g.nodes.set(node.id, container)
  // add to the beginning, so they're always behind items
  state.g.world.addChildAt(container, 0)

  {
    const texture = state.textures[node.textureId]
    const sprite = new PIXI.Sprite(texture)
    sprite.width = CELL_SIZE
    sprite.height = CELL_SIZE

    container.addChild(sprite)
  }

  for (const direction of node.outputs) {
    const texture = state.textures[TextureId.enum.NodeArrow]
    const sprite = new PIXI.Sprite(texture)

    sprite.anchor.set(0.5)

    sprite.position.set(CELL_SIZE / 2)
    sprite.width = CELL_SIZE
    sprite.height = CELL_SIZE
    sprite.alpha = 0.8

    switch (direction) {
      case 'n':
        sprite.angle = -90
        break
      case 's':
        sprite.angle = 90
        break
      case 'e':
        // default angle
        break
      case 'w':
        sprite.angle = 180
        break
    }

    container.addChild(sprite)
  }
}
