import { uniqueId } from 'lodash-es'
import * as PIXI from 'pixi.js'
import { useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'
import { useImmer } from 'use-immer'
import { Game, initGame, step } from '../game'
import { TextureId } from '../textures'
import { Texture } from '../textures/texture'
import { CELL_SIZE, TICK_DURATION } from './const'
import { gameToGameView } from './game-view'
import { destroyPixi, initPixi } from './init-pixi'
import { PixiState } from './pixi-state'

function renderGame(game: Game, state: PixiState) {
  state.lastTickTime = self.performance.now()
  state.viewPrev = state.viewNext
  state.viewNext = gameToGameView(game)

  if (!state.viewPrev) {
    return
  }

  for (const node of Object.values(state.viewPrev.nodes)) {
    if (!state.g.nodes.has(node.id)) {
      const container = new PIXI.Container()
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
        const texture =
          state.textures[TextureId.enum.NodeArrow]
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
  }

  for (const item of Object.values(state.viewPrev.items)) {
    let g = state.g.items.get(item.id)

    if (!state.viewNext.items[item.id]) {
      if (g) {
        g.destroy()
      }
      continue
    }

    if (!g) {
      g = new PIXI.Graphics()
      g.rect(
        CELL_SIZE * 0.2,
        CELL_SIZE * 0.2,
        CELL_SIZE * 0.6,
        CELL_SIZE * 0.6,
      )
      g.fill({ color: item.color })

      state.g.items.set(item.id, g)
      state.g.world.addChild(g)
    }

    g.position.set(
      item.p.x * CELL_SIZE,
      item.p.y * CELL_SIZE,
    )
  }
}

export function AppGrid() {
  const [game, setGame] = useImmer(initGame)
  const state = useRef<PixiState | null>(null)
  useEffect(() => {
    const interval = setInterval(() => {
      setGame(step)
    }, TICK_DURATION)
    return () => {
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (state.current) {
      renderGame(game, state.current)
    }
  }, [game])

  return (
    <div className="w-dvw h-dvh relative">
      <Canvas state={state} />
      <div className="absolute top-0 left-0 p-1 pointer-events-none">
        <span className="block text-gray-400 leading-none">
          Tick: {game.tick}
        </span>
      </div>
    </div>
  )
}

interface CanvasProps {
  state: React.MutableRefObject<PixiState | null>
}

export function Canvas({ state }: CanvasProps) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    invariant(container.current)
    const id = uniqueId()
    initPixi(id, container.current).then((_state) => {
      state.current = _state
    })
    return () => {
      state.current = null
      destroyPixi(id)
    }
  }, [])

  return (
    <div ref={container} className="w-full h-full">
      <div className="hidden">
        {TextureId.options.map((id) => (
          <Texture key={id} id={id} />
        ))}
      </div>
    </div>
  )
}
