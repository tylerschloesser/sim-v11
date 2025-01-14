import invariant from 'tiny-invariant'
import { Game } from './game'
import { NodeType } from './node'
import { addNode, connect, parseNodeId } from './util'

export function initGame(): Game {
  const game: Game = {
    tick: 0,
    updateType: null,
    nodes: {},
    items: {},
    nextItemId: 0,
    robots: {},
    nextRobotId: 0,
    jobs: {},
    nextJobId: 0,
  }

  const config = [
    {
      id: '0.-2',
      type: NodeType.enum.RobotTerminal,
      outputs: [],
    },
    {
      id: '0.0',
      outputs: ['0.1'],
    },
    {
      id: '0.1',
      outputs: ['1.1'],
    },
    {
      id: '1.1',
      outputs: ['1.0'],
    },
    {
      id: '1.0',
      outputs: ['0.0', '2.0'],
    },
    {
      id: '-1.0',
      outputs: ['0.0'],
      type: NodeType.enum.Producer,
    },
    {
      id: '2.0',
      outputs: [],
      type: NodeType.enum.Consumer,
    },
  ] satisfies {
    id: string
    outputs: string[]
    type?: NodeType
  }[]

  for (const { id, type } of config) {
    const p = parseNodeId(id)
    addNode(game, { p, type })
  }

  for (const { id: inputId, outputs } of config) {
    for (const outputId of outputs) {
      invariant(
        connect(game.nodes, inputId, outputId).success,
      )
    }
  }

  return game
}
