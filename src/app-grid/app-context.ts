import React from 'react'
import { Updater } from 'use-immer'
import { Input } from '../app-graph/input-view'

export const AppContext = React.createContext<{
  input: Input
  setInput: Updater<Input>
}>(null!)
