import clsx from 'clsx'
import { uniqueId } from 'lodash-es'
import * as PIXI from 'pixi.js'
import React, { useEffect, useMemo, useRef } from 'react'
import invariant from 'tiny-invariant'
import { Updater, useImmer } from 'use-immer'
import { Input } from '../app-graph/input-view'
import {
  Game,
  initGame,
  NodeType,
  step,
  UpdateType,
} from '../game'
import { TextureId } from '../textures'
import { Texture } from '../textures/texture'
import { AppActions } from './app-actions'
import { AppContext } from './app-context'
import { CELL_SIZE, TICK_DURATION } from './const'
import { gameToGameView, NodeView } from './game-view'
import { initKeyboard } from './init-keyboard'
import { destroyPixi, initPixi } from './init-pixi'
import { NodeContainer, PixiState } from './pixi-state'

function renderNode(node: NodeView, state: PixiState) {
  let container = state.g.nodes.get(node.id)
  if (container?.ref === node) {
    return
  }
  container?.destroy({ children: true })

  container = new NodeContainer(node)
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

function renderGame(game: Game, state: PixiState) {
  const view = gameToGameView(game)
  const current = new Set(state.g.nodes.keys())
  for (const node of Object.values(view.nodes)) {
    current.delete(node.id)
    renderNode(node, state)
  }

  for (const id of current) {
    const container = state.g.nodes.get(id)
    invariant(container)
    container.destroy({ children: true })

    state.g.nodes.delete(id)
  }
}

function renderTick(game: Game, state: PixiState) {
  state.lastTickTime = self.performance.now()
  state.viewPrev = state.viewNext
  state.viewNext = gameToGameView(game)

  if (!state.viewPrev) {
    return
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

function initialGame(): Game {
  const item = localStorage.getItem('game')
  if (!item) {
    return initGame()
  }
  const parsed = JSON.parse(item)
  console.log('loading game', parsed)
  return Game.parse(parsed)
}

export function AppGrid() {
  const [game, setGame] = useImmer(initialGame)
  const [input, setInput] = useImmer<Input>({
    nodeType: NodeType.enum.Normal,
    hoverCell: null,
  })
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
      if (game.updateType === UpdateType.enum.Tick) {
        renderTick(game, state.current)
      } else {
        renderGame(game, state.current)
      }
    }
  }, [game])

  useEffect(() => {
    localStorage.setItem(
      'game',
      JSON.stringify(Game.parse(game)),
    )
  }, [game])

  const gameRef = useRef<Game>(game)
  useEffect(() => {
    gameRef.current = game
  }, [game])

  const inputRef = useRef<Input>(input)
  useEffect(() => {
    inputRef.current = input
  }, [input])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    initKeyboard({ signal, setGame, inputRef })
    return () => {
      controller.abort()
    }
  }, [setGame])

  const context = useMemo(
    () => ({
      input,
      setInput,
    }),
    [input, setInput],
  )

  return (
    <AppContext.Provider value={context}>
      <div className="w-dvw h-dvh relative">
        <Canvas
          state={state}
          setInput={setInput}
          setGame={setGame}
          gameRef={gameRef}
          inputRef={inputRef}
        />
        <div
          className={clsx(
            'absolute top-0 left-0 p-1 pointer-events-none',
            'text-gray-400 leading-none',
          )}
        >
          <div>Tick: {game.tick}</div>
          <div>{JSON.stringify(input)}</div>
        </div>
        <AppActions setGame={setGame} />
      </div>
    </AppContext.Provider>
  )
}

interface CanvasProps {
  state: React.MutableRefObject<PixiState | null>
  setInput: Updater<Input>
  setGame: Updater<Game>
  gameRef: React.MutableRefObject<Game>
  inputRef: React.MutableRefObject<Input>
}

export function Canvas({
  state,
  setInput,
  setGame,
  gameRef,
  inputRef,
}: CanvasProps) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    invariant(container.current)
    const id = uniqueId()
    initPixi({
      id,
      container: container.current,
      setInput,
      setGame,
      inputRef,
    }).then((_state) => {
      state.current = _state
      renderGame(gameRef.current, _state)
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
