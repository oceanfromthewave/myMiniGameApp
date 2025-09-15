import { Routes, Route, useParams, useNavigate } from 'react-router-dom'
import games from './games'
import Home from './Home'
import SettingsModal from '../components/layout/SettingsModal'
import { useState } from 'react'

function GameRoute() {
  const { id } = useParams()
  const nav = useNavigate()
  const game = games.find(g => g.id === id)
  if (!game) return null
  const Game = game.component
  return <Game onBack={() => nav('/')} />
}

export default function App() {
  const [showSettings, setShowSettings] = useState(false)
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:id" element={<GameRoute />} />
      </Routes>
      <div className="fab">
        <button className="btn btn--primary" onClick={() => setShowSettings(true)} aria-label="설정 열기">
          설정
        </button>
      </div>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  )
}