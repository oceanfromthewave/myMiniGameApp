// src/app/Home.jsx
import React from 'react'
import { ChevronLeft } from 'lucide-react'
import games from './games'
import useTheme from '../hooks/useTheme'

export default function Home({ onSelect }) {
  const { theme, toggleTheme } = useTheme()
  return (
    <div className="home-screen">
      <div className="container">
        <div className="home-header">
          <h1 className="home-title">미니게임</h1>
          <p className="home-sub">간단하고 재미있는 게임을 즐겨보세요</p>
          <div className="row-center mt-2">
            <button className="btn" onClick={toggleTheme} aria-label="테마 전환">
              {theme === 'midnight' ? '선셋 테마'
                : theme === 'sunset' ? '그래파이트 테마'
                : '미드나이트 테마'}
            </button>
          </div>
        </div>

        <div className="game-cards">
          {games.map((g) => (
            <button key={g.id} onClick={() => onSelect(g.id)} className="game-card" aria-label={`${g.title} 실행`}>
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

