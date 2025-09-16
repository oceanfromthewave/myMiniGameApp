import React from 'react'
import GameHeader from '../../components/layout/GameHeader'
import useBrickBreaker from './useBrickBreaker'
import useVisibilityPause from '../../hooks/useVisibilityPause'
import { saveScore } from '../../utils/leaderboard'
import { getUsername } from '../../utils/device'

export default function BrickBreakerGame({ onBack }) {
  const {
    canvasRef,
    score,
    highScore,
    lastScore,
    gameOver,
    reset,
    movePaddle,
    activePowerups,
    fallingPowerups,
    isPaused,
    togglePause,
  } = useBrickBreaker()

  const savedRef = React.useRef(false)

  useVisibilityPause(() => { if (!isPaused) togglePause() })

  // Press & hold 이동
  const holdRef = React.useRef(null)
  const stopHold = React.useCallback(() => {
    if (holdRef.current) { clearInterval(holdRef.current); holdRef.current = null }
  }, [])
  const startHold = React.useCallback((dir) => {
    stopHold()
    movePaddle(dir) // 즉시 1회
    holdRef.current = setInterval(() => movePaddle(dir), 60) // 약 40fps
  }, [movePaddle, stopHold])

  React.useEffect(() => () => stopHold(), [stopHold])

  React.useEffect(() => {
    if (!gameOver || savedRef.current) return
    savedRef.current = true
    saveScore({ game: 'brickbreaker', score, username: getUsername() }).catch(() => {})
  }, [gameOver, score])

  return (
    <div className="screen">
      <div className="container">
        <GameHeader title="벽돌깨기" onBack={onBack} onReset={reset} />

        <div className="text-center mb-6">
          <div className="card">
            <p className="muted">점수</p>
            <p className="title-2xl accent">{score}</p>
            <p className="muted mt-2">최고 점수: {highScore}</p>
            <p className="muted">최근: {lastScore}</p>
          </div>
        </div>
        
           {activePowerups.length > 0 && (
          <div className="text-center mb-6">
            <div className="card">
              <p className="muted">파워업</p>
              <div className="flex justify-center gap-2 mt-2">
                {activePowerups.map((p, i) => (
                  <img
                    key={i}
                    src={p.icon}
                    alt={p.type}
                    className="w-6 h-6"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="board-shell" style={{ position: 'relative', width: 'fit-content', margin: '0 auto', maxWidth: '100%' }}>
          <canvas ref={canvasRef} width={480} height={320} />
          {fallingPowerups.map((p, i) => (
            <img
              key={i}
              src={p.icon}
              alt=""
              className="w-4 h-4 absolute"
              style={{ left: p.x - 8, top: p.y - 8 }}
              aria-hidden="true"
            />
          ))}
        </div>

        {gameOver && (
          <div className="text-center mb-4">
            <div className="notice notice--danger">
              <h2 className="title-xl mb-2">게임 오버!</h2>
              <p>최종 점수: {score}</p>
            </div>
          </div>
        )}

<div className="mb-4">
          <div className="grid-2">
            <button
              className="btn btn--square"
              onClick={() => movePaddle('left')}
              onMouseDown={() => startHold('left')}
              onMouseUp={stopHold}
              onMouseLeave={stopHold}
              onTouchStart={(e) => { e.preventDefault(); startHold('left') }}
              onTouchEnd={stopHold}
              onTouchCancel={stopHold}
              aria-label="왼쪽으로 이동"
            >←</button>
            <button
              className="btn btn--square"
              onClick={() => movePaddle('right')}
              onMouseDown={() => startHold('right')}
              onMouseUp={stopHold}
              onMouseLeave={stopHold}
              onTouchStart={(e) => { e.preventDefault(); startHold('right') }}
              onTouchEnd={stopHold}
              onTouchCancel={stopHold}
              aria-label="오른쪽으로 이동"
            >→</button>
          </div>
        </div>

        <div className="row-center mb-4">
          <button className="btn btn--warning btn--lg" onClick={togglePause} aria-label={isPaused ? '재생' : '일시정지'}>
            {isPaused ? '재생' : '일시정지'}
          </button>
        </div>

        {isPaused && !gameOver && (
          <div className="text-center mb-4">
            <div className="notice notice--warning">
              <h2 className="title-xl">일시정지</h2>
            </div>
          </div>
        )}

        <div className="info-box">
          <p className="mb-2">조작법</p>
          <p>← →: 좌우 이동</p>
          <p className="mt-2 muted-light">목표: 모든 벽돌을 제거하세요!</p>
        </div>
      </div>
    </div>
  )
}