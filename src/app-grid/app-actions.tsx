import React, {
  ChangeEvent,
  useCallback,
  useContext,
  useMemo,
} from 'react'
import { initGame } from '../game'
import { NodeType } from '../game/node'
import { AppContext } from './app-context'
import { AppViewType } from './app-view'
import { Button } from './button'

export function AppActions() {
  const { view, setView } = useContext(AppContext)
  const onClickHome = useCallback(() => {
    setView((draft) => {
      draft.type = AppViewType.Home
    })
  }, [setView])
  return (
    <div className="absolute bottom-0 right-0 p-1 flex gap-2">
      {view.type === AppViewType.Select && <SelectView />}
      {view.type === AppViewType.AddNode && <AddNodeView />}
      {view.type === AppViewType.AddForm && <AddFormView />}
      {view.type === AppViewType.Home && <HomeView />}
      {view.type !== AppViewType.Home && (
        <Button onClick={onClickHome}>Home</Button>
      )}
    </div>
  )
}

function HomeView() {
  const { setGame, setView } = useContext(AppContext)
  const onClickReset = useCallback(() => {
    if (window.confirm('Reset game?')) {
      setGame(initGame)
    }
  }, [setGame])

  const onClickAddNode = useCallback(() => {
    setView((draft) => {
      draft.type = AppViewType.AddNode
    })
  }, [setView])

  const onClickAddForm = useCallback(() => {
    setView((draft) => {
      draft.type = AppViewType.AddForm
    })
  }, [setView])

  const onClickSelect = useCallback(() => {
    setView((draft) => {
      draft.type = AppViewType.Select
    })
  }, [setView])

  const buttons = useMemo(
    () => [
      { label: 'Select', onClick: onClickSelect },
      { label: 'Add Node', onClick: onClickAddNode },
      { label: 'Add Form', onClick: onClickAddForm },
      { label: 'Reset', onClick: onClickReset },
    ],
    [
      onClickSelect,
      onClickAddNode,
      onClickAddForm,
      onClickReset,
    ],
  )

  return (
    <div>
      {buttons.map(({ label, onClick }) => (
        <Button key={label} onClick={onClick}>
          {label}
        </Button>
      ))}
    </div>
  )
}

function SelectView() {
  return <>TODO</>
}

function AddNodeView() {
  return (
    <>
      <ChooseNodeType />
    </>
  )
}

function AddFormView() {
  return <>TODO</>
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

  function isDisabled(nodeType: NodeType): boolean {
    switch (nodeType) {
      case NodeType.enum.FormRoot:
      case NodeType.enum.FormLeaf:
        return true
      default:
        return false
    }
  }

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
            disabled={isDisabled(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}
