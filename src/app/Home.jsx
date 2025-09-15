import React from 'react'
import { ChevronLeft, Moon, SunMedium, Palette } from 'lucide-react'
import games from './games'
import useTheme from '../hooks/useTheme'
import usePwaInstall from '../hooks/usePwaInstall'
import { useNavigate } from 'react-router-dom'

export default function Home({ onSelect }) {
  const { theme, toggleTheme } = useTheme()
  const { canInstall, install } = usePwaInstall()
  const nav = useNavigate()
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
            <button onClick={() => nav(`/${g.id}`)} className="game-card" aria-label={`${g.title} 실행`}>
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

        {canInstall && (
          <div className="notice notice--info mt-6">
            <div className="row-center">
              <span className="mr-2">앱으로 설치하면 오프라인에서도 실행할 수 있어요.</span>
              <button className="btn btn--primary" onClick={install} aria-label="앱 설치">설치</button>
            </div>
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
    </div>
  )
}