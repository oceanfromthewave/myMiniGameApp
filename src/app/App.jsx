import React, { useState } from 'react'
import Home from './Home'
import games from './games'

export default function App() {
  const [screen, setScreen] = useState('home')

  if (screen === 'home') {
    return <Home onSelect={(id) => setScreen(id)} />
  }

  const game = games.find((g) => g.id === screen)
  if (game) {
    const Game = game.component
    return <Game onBack={() => setScreen('home')} />
  }
  return null
}
