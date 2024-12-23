import React, {
  ChangeEvent,
  useCallback,
  useContext,
  useMemo,
} from 'react'
import { initGame, NodeType } from '../game'
import { AppContext } from './app-context'
import { AppViewType } from './app-view'

export function AppActions() {
  const { view } = useContext(AppContext)
  return (
    <div className="absolute bottom-0 right-0 p-1 flex gap-2">
      {view.type === AppViewType.AddNode && <AddNodeView />}
      {view.type === AppViewType.Home && <HomeView />}
    </div>
  )
}

function HomeView() {
  const { setGame } = useContext(AppContext)
  const onClickReset = useCallback(() => {
    setGame(initGame)
  }, [setGame])
  return (
    <div>
      Home
      <button onClick={onClickReset}>Reset</button>
    </div>
  )
}

function AddNodeView() {
  return (
    <>
      <ChooseNodeType />
    </>
  )
}

function ChooseNodeType() {
  const { view, setView } = React.useContext(AppContext)
  const options = useMemo(
    () =>
      NodeType.options.map((nodeType) => ({
        label: nodeType,
        value: nodeType,
      })),
    [],
  )

  const onChange = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) => {
      setView((draft) => {
        draft.nodeType = NodeType.parse(ev.target.value)
      })
    },
    [],
  )

  return (
    <div role="radiogroup" className="flex flex-col">
      {options.map((option) => (
        <label key={option.value} className="flex gap-1">
          <input
            type="radio"
            name="nodeType"
            value={option.value}
            checked={option.value === view.nodeType}
            onChange={onChange}
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}
