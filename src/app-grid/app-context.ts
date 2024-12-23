import React from 'react'
import { Updater } from 'use-immer'
import { AppView } from './app-view'

export const AppContext = React.createContext<{
  view: AppView
  setView: Updater<AppView>
}>(null!)
