import clsx from 'clsx'
import { uniqueId } from 'lodash-es'
import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { BehaviorSubject } from 'rxjs'
import invariant from 'tiny-invariant'
import { useImmer } from 'use-immer'
import { Vec2 } from '../common/vec2'
import { initGame } from '../game'
import { Game, UpdateType } from '../game/game'
import { NodeType } from '../game/node'
import { tick } from '../game/tick'
import { toNodeId } from '../game/util'
import { TextureId } from '../textures'
import { Texture } from '../textures/texture'
import { AppActions } from './app-actions'
import { AppContext } from './app-context'
import { AppView, AppViewType } from './app-view'
import { AppWidget } from './app-widget'
import { TICK_DURATION } from './const'
import { initKeyboard } from './init-keyboard'
import { destroyPixi, initPixi } from './init-pixi'
import { PixiState } from './pixi-state'
import { renderGame } from './render-game'
import { renderTick } from './render-tick'

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
    widgets: new Map(),
  })
  const state = useRef<PixiState | null>(null)

  const widgetContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setGame(tick)
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

  const view$ = useRef(new BehaviorSubject(view))
  useEffect(() => {
    view$.current.next(view)
  }, [view])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    initKeyboard({ signal, setGame, view$: view$.current })
    return () => {
      controller.abort()
    }
  }, [setGame])

  useEffect(() => {
    setView((draft) => {
      draft.widgets.clear()

      for (const node of Object.values(game.nodes).filter(
        (node) => node.type === NodeType.enum.FormRoot,
      )) {
        draft.widgets.set(node.id, {
          id: node.id,
          p: new Vec2(node.p),
        })
      }
    })
  }, [game.nodes])

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
      <div className="w-dvw h-dvh relative overflow-hidden">
        <Canvas
          state={state}
          gameRef={gameRef}
          view$={view$.current}
          widgetContainer={widgetContainer}
        />
        <div
          ref={widgetContainer}
          className="absolute inset-0 pointer-events-none"
        >
          {Array.from(view.widgets.values()).map(
            (widget) => (
              <AppWidget key={widget.id} {...widget} />
            ),
          )}
        </div>
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
    () => (view.hover ? toNodeId(view.hover.p) : null),
    [view.hover],
  )
  const node = id ? game.nodes[id] : null
  return (
    node && (
      <div>
        <div>{node.type}</div>
        <div>{Object.keys(node.outputs).join(',')}</div>
      </div>
    )
  )
}

interface CanvasProps {
  state: React.MutableRefObject<PixiState | null>
  gameRef: React.MutableRefObject<Game>
  view$: BehaviorSubject<AppView>
  widgetContainer: React.RefObject<HTMLElement>
}

export function Canvas({
  state,
  gameRef,
  view$,
  widgetContainer,
}: CanvasProps) {
  const container = useRef<HTMLDivElement>(null)

  const { setView, setGame } = useContext(AppContext)

  useEffect(() => {
    invariant(container.current)
    invariant(widgetContainer.current)
    const id = uniqueId()
    initPixi({
      id,
      container: container.current,
      setView,
      setGame,
      view$,
      widgetContainer: widgetContainer.current,
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
