import React from 'react'
import { ChevronLeft, Moon, SunMedium, Palette, Trophy } from 'lucide-react'
import games from './games'
import useTheme from '../hooks/useTheme'
import usePwaInstall from '../hooks/usePwaInstall'
import { useNavigate } from 'react-router-dom'
import Leaderboard from '../components/Leaderboard'
import LeaderboardModal from '../components/LeaderboardModal'

export default function Home({ onSelect }) {
  const { theme, toggleTheme } = useTheme()
  const { canInstall, install } = usePwaInstall()
  const nav = useNavigate()
  const [lbGame, setLbGame] = React.useState('2048')
  const [showLb, setShowLb] = React.useState(false)
  
  return (
    <div className="home-screen">
      <div className="container">
        <div className="home-header">
          <h1 className="home-title">미니게임</h1>
          <p className="home-sub">간단하고 재미있는 게임을 즐겨보세요</p>
          <div className="row-center mt-2">
            <button className="btn btn--ghost" onClick={toggleTheme} aria-label="테마 전환">
              {theme === 'midnight' ? <SunMedium size={16} />
                : theme === 'sunset' ? <Palette size={16} />
                : <Moon size={16} />}
              {theme === 'midnight' ? '선셋'
                : theme === 'sunset' ? '그래파이트'
                : '미드나이트'}
            </button>
          </div>
        </div>

        <div className="game-cards">
        {games.map((g) => (
            <button
              key={g.id}
              onClick={() => nav(`/${g.id}`)}
              className="game-card"
              aria-label={`${g.title} 실행`}
            >
              <div className="game-card__row">
                <div className="game-card__emoji">{g.icon}</div>
                <div className="game-card__meta">
                  <h3 className="title-xl">{g.title}</h3>
                  <p className="game-card__desc">{g.description}</p>
                </div>
                <div className="game-card__chev">
                  <ChevronLeft size={24} className="rot-180" />
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12">
          <div className="hstack-4 lb-game-tabs" style={{ justifyContent: 'center' }}>
            <button className="btn btn--ghost" onClick={() => setLbGame('2048')} aria-pressed={lbGame==='2048'}>2048</button>
            <button className="btn btn--ghost" onClick={() => setLbGame('tetris')} aria-pressed={lbGame==='tetris'}>테트리스</button>
            <button className="btn btn--ghost" onClick={() => setLbGame('brickbreaker')} aria-pressed={lbGame==='brickbreaker'}>벽돌깨기</button>
            <button className="btn btn--ghost" onClick={() => setLbGame('pinball')} aria-pressed={lbGame==='pinball'}>핀볼</button>
          </div>
          <div className="mt-2">
            <Leaderboard game={lbGame} compact />
          </div>

          <div className="lb-actions row-center">
            <button className="btn btn--ghost" onClick={() => setShowLb(true)} aria-label="리더보드 전체 보기">
              <Trophy size={16} /> 전체보기
            </button>
          </div>
        </div>

        {canInstall && (
  <div className="install-card">
    <div className="install-icon">📲</div>
    <div className="install-content">
      <p className="title-md">앱으로 설치해 보세요</p>
      <p className="muted-light">오프라인에서도 실행되고 더 빠릅니다.</p>
    </div>
    <button className="btn btn--primary btn--pill" onClick={install} aria-label="앱 설치">
      설치
    </button>
  </div>
)}

        <div className="home-footer mt-12">
          <p className="mb-2">더 많은 게임을 추가할게요</p>
          <div className="dots">
            <div className="dot"></div>
            <div className="dot delay-100"></div>
            <div className="dot delay-200"></div>
          </div>
        </div>
      </div>

      {showLb && <LeaderboardModal game={lbGame} onClose={() => setShowLb(false)} />}
    </div>
  )
}