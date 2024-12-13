import { debounce, uniqueId } from 'lodash-es'
import * as PIXI from 'pixi.js'
import { useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'
import { useImmer } from 'use-immer'
import { mod } from '../common/math'
import { Vec2 } from '../common/vec2'
import {
  Game,
  initGame,
  Node,
  NodeColor,
  NodeItem,
  NodeRef,
  NodeType,
  step,
} from '../game'
import { renderSvgToImage, TextureId } from '../textures'
import { Texture } from '../textures/texture'

const CELL_SIZE = 64

function itemColor(item: NodeItem): string {
  const s = 40
  const l = 50
  const o = 1
  switch (item.color) {
    case NodeColor.enum.Green:
      return `hsla(120, ${s}%, ${l}%, ${o.toFixed(2)})`
    case NodeColor.enum.Red:
      return `hsla(0, ${s}%, ${l}%, ${o.toFixed(2)})`
    case NodeColor.enum.Blue:
      return `hsla(240, ${s}%, ${l}%, ${o.toFixed(2)})`
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
  }
}

type Direction = 'n' | 's' | 'e' | 'w'

interface NodeView {
  id: string
  p: Vec2
  textureId: TextureId
  outputs: Direction[]
}

interface ItemView {
  id: string
  p: Vec2
  color: string
}

interface GameView {
  nodes: Record<string, NodeView>
  items: Record<string, ItemView>
}

function gameToGameView(game: Game): GameView {
  function refToNode({ id }: NodeRef) {
    const node = game.nodes.get(id)
    invariant(node)
    return node
  }

  const view: GameView = {
    nodes: {},
    items: {},
  }

  for (const node of game.nodes.values()) {
    const textureId = nodeTextureId(node)

    function outputToDirection(output: Node): Direction {
      const dx = output.p.x - node.p.x
      const dy = output.p.y - node.p.y
      if (dx === 0 && dy === -1) {
        return 'n'
      }
      if (dx === 0 && dy === 1) {
        return 's'
      }
      if (dx === 1 && dy === 0) {
        return 'e'
      }
      if (dx === -1 && dy === 0) {
        return 'w'
      }
      throw new Error('Invalid output direction')
    }

    const outputs = node.outputs
      .map(refToNode)
      .map(outputToDirection)

    const nodeView: NodeView = {
      id: node.id,
      p: new Vec2(node.p),
      outputs,
      textureId,
    }

    view.nodes[node.id] = nodeView

    if (!node.item) {
      continue
    }

    view.items[node.item.id] = {
      id: node.item.id,
      color: itemColor(node.item),
      p: nodeView.p,
    }
  }
  return view
}

function renderFrame(state: PixiState) {
  if (!state.viewPrev) {
    return
  }
  invariant(state.viewNext)
}

function renderGame(game: Game, state: PixiState) {
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
    }, 150)
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

interface PixiState {
  id: string
  canvas: HTMLCanvasElement
  app: PIXI.Application
  ro: ResizeObserver
  controller: AbortController
  g: Graphics
  textures: Record<TextureId, PIXI.Texture>
  frameHandle: number

  viewPrev: GameView | null
  viewNext: GameView | null
}

const cache = new Map<string, Promise<PixiState>>()

async function initTextures(
  container: HTMLDivElement,
): Promise<Record<TextureId, PIXI.Texture>> {
  const textures: Partial<Record<TextureId, PIXI.Texture>> =
    {}
  for (const id of TextureId.options) {
    const svg = container.querySelector(
      `svg[data-texture-id="${id}"]`,
    )
    invariant(svg instanceof SVGSVGElement)

    textures[id] = await PIXI.Assets.load(
      await renderSvgToImage(svg),
    )
  }
  return textures as Record<TextureId, PIXI.Texture>
}

function initPixi(
  id: string,
  container: HTMLDivElement,
): Promise<PixiState> {
  const promise: Promise<PixiState> = new Promise(
    async (resolve) => {
      const { width, height } =
        container.getBoundingClientRect()

      const canvas = document.createElement('canvas')
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      canvas.width = width
      canvas.height = height
      container.appendChild(canvas)

      const app = new PIXI.Application()
      await app.init({
        canvas,
        width: canvas.width,
        height: canvas.height,
        antialias: true,
      })

      const textures = await initTextures(container)

      const reloadOnResize = debounce(
        window.location.reload.bind(window.location),
        500,
      )

      const ro = new ResizeObserver(() => {
        const { width, height } =
          canvas.getBoundingClientRect()
        if (
          canvas.width === width &&
          canvas.height === height
        ) {
          return
        }
        // TODO dynamically update canvas size
        reloadOnResize()
        // canvas.width = width
        // canvas.height = height
        // app.resize()
      })
      ro.observe(canvas)

      const controller = new AbortController()
      const { signal } = controller

      const viewport = new Vec2(width, height)
      const cellSize = CELL_SIZE
      const g = initGraphics(app, cellSize, viewport)

      let camera = Vec2.ZERO
      let pointer: Vec2 | null = null
      let pointerDown: Vec2 | null = null
      let delta = Vec2.ZERO

      function updateCamera() {
        {
          const t = camera
            .mul(cellSize)
            .add(delta)
            .mul(-1)
            .add(viewport.div(2))
          g.grid.position.set(
            mod(t.x, cellSize) - cellSize,
            mod(t.y, cellSize) - cellSize,
          )
        }

        {
          const t = camera
            .mul(cellSize)
            .add(delta)
            .mul(-1)
            .add(viewport.div(2))
          g.world.position.set(t.x, t.y)
        }
      }
      updateCamera()

      function screenToWorld(screen: Vec2): Vec2 {
        return screen
          .sub(viewport.div(2))
          .add(delta)
          .div(cellSize)
          .add(camera)
      }

      function worldToScreen(world: Vec2): Vec2 {
        return world
          .sub(camera)
          .mul(cellSize)
          .add(viewport.div(2))
          .sub(delta)
      }

      document.addEventListener(
        'pointerenter',
        (ev) => {
          pointer = new Vec2(ev.offsetX, ev.offsetY)
          const world = screenToWorld(pointer)
          const screen = worldToScreen(world).floor()

          g.pointer.visible = true
          g.pointer.position.set(screen.x, screen.y)
        },
        { signal },
      )

      document.addEventListener(
        'pointermove',
        (ev) => {
          if (pointerDown !== null) {
            const p = new Vec2(ev.offsetX, ev.offsetY)
            // update delta before updating camera!
            delta = pointerDown.sub(p)
            updateCamera()
          }

          pointer = new Vec2(ev.offsetX, ev.offsetY)
          const world = screenToWorld(pointer)
          const screen = worldToScreen(world.floor())

          g.pointer.visible = true
          g.pointer.position.set(screen.x, screen.y)
        },
        { signal },
      )

      document.addEventListener(
        'pointerleave',
        (_ev) => {
          pointer = null
          g.pointer.visible = false
        },
        { signal },
      )

      document.addEventListener(
        'pointerdown',
        (ev) => {
          pointerDown = new Vec2(ev.offsetX, ev.offsetY)
        },
        { signal },
      )

      document.addEventListener(
        'pointerup',
        (_ev) => {
          pointerDown = null
          camera = camera.add(delta.div(cellSize))
          console.log('camera', camera)
          delta = Vec2.ZERO
          updateCamera()
        },
        { signal },
      )

      const state: PixiState = {
        id,
        canvas,
        app,
        ro,
        controller,
        g,
        textures,
        frameHandle: -1,
        viewPrev: null,
        viewNext: null,
      }

      const frameRequestCallback: FrameRequestCallback =
        () => {
          renderFrame(state)
          state.frameHandle = self.requestAnimationFrame(
            frameRequestCallback,
          )
        }
      state.frameHandle = self.requestAnimationFrame(
        frameRequestCallback,
      )

      resolve(state)
    },
  )
  cache.set(id, promise)
  return promise
}

interface Graphics {
  pointer: PIXI.Graphics
  grid: PIXI.Graphics
  world: PIXI.Container
  nodes: Map<string, PIXI.Container>
  items: Map<string, PIXI.Graphics>
}

function initGraphics(
  app: PIXI.Application,
  cellSize: number,
  viewport: Vec2,
): Graphics {
  const g: Graphics = {
    pointer: new PIXI.Graphics(),
    grid: new PIXI.Graphics(),
    world: new PIXI.Container(),
    nodes: new Map(),
    items: new Map(),
  }

  {
    const cols = Math.ceil(viewport.x / cellSize) + 1
    const rows = Math.ceil(viewport.y / cellSize) + 1
    g.grid.setStrokeStyle({
      color: 'hsl(0, 0%, 20%)',
      width: 2,
    })
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        g.grid
          .moveTo(col * cellSize, 0)
          .lineTo(col * cellSize, rows * cellSize)
          .moveTo(0, row * cellSize)
          .lineTo(cols * cellSize, row * cellSize)
      }
    }
    g.grid.stroke()
    app.stage.addChild(g.grid)
  }

  {
    app.stage.addChild(g.world)
  }

  {
    g.pointer.visible = false
    g.pointer.rect(0, 0, cellSize, cellSize)
    g.pointer.stroke({
      color: 'hsl(240, 50%, 50%)',
      width: 2,
    })
    app.stage.addChild(g.pointer)
  }

  return g
}

function destroyPixi(id: string) {
  const promise = cache.get(id)
  invariant(promise)
  promise.then((state) => {
    self.cancelAnimationFrame(state.frameHandle)
    state.controller.abort()
    state.canvas.style.display = 'none'
    state.ro.disconnect()
    state.app.destroy(false, true)
    state.canvas.remove()
    cache.delete(id)
  })
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
