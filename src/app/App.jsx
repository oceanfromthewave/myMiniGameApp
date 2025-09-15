import React, { useState } from 'react'
import Home from './Home'
import games from './games'
import SettingsModal from '../components/layout/SettingsModal'
import { Settings } from 'lucide-react'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [showSettings, setShowSettings] = useState(false)

  if (screen === 'home') {
    return (
      <>
        <Home onSelect={(id) => setScreen(id)} />
        <div className="fab">
          <button className="btn btn--primary" onClick={() => setShowSettings(true)} aria-label="설정 열기">
            <Settings size={18} />
            설정
          </button>
        </div>
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </>
    )
  }

  const game = games.find((g) => g.id === screen)
  if (game) {
    const Game = game.component
    return (
      <>
        <Game onBack={() => setScreen('home')} />
        <div className="fab">
          <button className="btn btn--primary" onClick={() => setShowSettings(true)} aria-label="설정 열기">
            <Settings size={18} />
            설정
          </button>
        </div>
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </>
    )
  }
  return null
}
