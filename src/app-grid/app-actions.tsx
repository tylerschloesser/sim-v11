import React, {
  ChangeEvent,
  useCallback,
  useMemo,
} from 'react'
import { Updater } from 'use-immer'
import { Game, initGame, NodeType } from '../game'
import { AppContext } from './app-context'

export interface AppActionsProps {
  setGame: Updater<Game>
}

export function AppActions({ setGame }: AppActionsProps) {
  const onClickReset = useCallback(() => {
    setGame(initGame)
  }, [setGame])
  return (
    <div className="absolute bottom-0 right-0 p-1 flex gap-2">
      <ChooseNodeType />
      <button onClick={onClickReset}>Reset</button>
    </div>
  )
}

function ChooseNodeType() {
  const { input, setInput } = React.useContext(AppContext)
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
      setInput((draft) => {
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
            checked={option.value === input.nodeType}
            onChange={onChange}
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}
