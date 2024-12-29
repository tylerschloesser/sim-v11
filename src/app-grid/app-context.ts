import React from 'react'
import { Updater } from 'use-immer'
import { Game } from '../game/game'
import { AppView } from './app-view'

export const AppContext = React.createContext<{
  game: Game
  setGame: Updater<Game>
  view: AppView
  setView: Updater<AppView>
}>(null!)
