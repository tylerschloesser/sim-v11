import clsx from 'clsx'
import { uniqueId } from 'lodash-es'
import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import invariant from 'tiny-invariant'
import { useImmer } from 'use-immer'
import { Game, initGame, step, UpdateType } from '../game'
import { NodeType } from '../game/node'
import { toNodeId } from '../game/util'
import { TextureId } from '../textures'
import { Texture } from '../textures/texture'
import { AppActions } from './app-actions'
import { AppContext } from './app-context'
import { AppView, AppViewType } from './app-view'
import { TICK_DURATION } from './const'
import { gameToGameView } from './game-view'
import { initKeyboard } from './init-keyboard'
import { destroyPixi, initPixi } from './init-pixi'
import { PixiState } from './pixi-state'
import { renderNode } from './render-node'
import { renderTick } from './render-tick'

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

function initialGame(): Game {
  const item = localStorage.getItem('game')
  if (!item) {
    return initGame()
  }
  const parsed = JSON.parse(item)
  console.log('loading game', parsed)
  const result = Game.safeParse(parsed)
  if (result.success) {
    return result.data
  }

  if (self.confirm('Failed to parse game. Reset?')) {
    localStorage.removeItem('game')
    return initGame()
  }

  throw new Error('Failed to parse game', {
    cause: result.error,
  })
}

export function AppGrid() {
  const [game, setGame] = useImmer(initialGame)
  const [view, setView] = useImmer<AppView>({
    type: AppViewType.Home,
    nodeType: NodeType.enum.Normal,
    hover: null,
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

  const viewRef = useRef<AppView>(view)
  useEffect(() => {
    viewRef.current = view
  }, [view])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    initKeyboard({ signal, setGame, viewRef })
    return () => {
      controller.abort()
    }
  }, [setGame])

  const context = useMemo(
    () => ({
      game,
      setGame,
      view,
      setView,
    }),
    [game, setGame, view, setView],
  )

  return (
    <AppContext.Provider value={context}>
      <div className="w-dvw h-dvh relative">
        <Canvas
          state={state}
          gameRef={gameRef}
          viewRef={viewRef}
        />
        <div
          className={clsx(
            'absolute top-0 left-0 p-1 pointer-events-none',
            'text-gray-400 leading-none',
          )}
        >
          <div>Tick: {game.tick}</div>
          <AppHover />
        </div>
        <AppActions />
      </div>
    </AppContext.Provider>
  )
}

function AppHover() {
  const { view, game } = useContext(AppContext)
  const id = useMemo(
    () => (view.hover ? toNodeId(view.hover) : null),
    [view.hover],
  )
  const node = id ? game.nodes[id] : null
  return node && <div>{node.type}</div>
}

interface CanvasProps {
  state: React.MutableRefObject<PixiState | null>
  gameRef: React.MutableRefObject<Game>
  viewRef: React.MutableRefObject<AppView>
}

export function Canvas({
  state,
  gameRef,
  viewRef,
}: CanvasProps) {
  const container = useRef<HTMLDivElement>(null)

  const { setView, setGame } = useContext(AppContext)

  useEffect(() => {
    invariant(container.current)
    const id = uniqueId()
    initPixi({
      id,
      container: container.current,
      setView,
      setGame,
      viewRef,
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
