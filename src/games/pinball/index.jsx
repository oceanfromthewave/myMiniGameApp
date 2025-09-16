import React from 'react'
import GameHeader from '../../components/layout/GameHeader'
import usePinball from './usePinball'
import useVisibilityPause from '../../hooks/useVisibilityPause'
import { getHighScore, getLastScore, bumpHighScore, setLastScore } from '../../utils/scores'
import { saveScore } from '../../utils/leaderboard'
import { getUsername } from '../../utils/device'

export default function PinballGame({ onBack }) {
  const { canvasRef, score, isPaused, gameOver, reset, togglePause, width, height,
    pressLeft, releaseLeft, pressRight, releaseRight, pressPlunger, releasePlunger } = usePinball()

  const [highScore, setHighScoreState] = React.useState(() => getHighScore('pinball'))
  const [lastScore, setLastScoreState] = React.useState(() => getLastScore('pinball'))
  const uploadedRef = React.useRef(false)

  useVisibilityPause(() => { if (!isPaused) togglePause() })

  React.useEffect(() => {
    if (!gameOver || uploadedRef.current) return
    uploadedRef.current = true
    bumpHighScore('pinball', score)
    setLastScore('pinball', score)
    setHighScoreState(getHighScore('pinball'))
    setLastScoreState(score)
    saveScore({ game: 'pinball', score, username: getUsername() }).catch(() => {})
  }, [gameOver, score])

  return (
    <div className="screen pinball-theme">
      <div className="container">
        <GameHeader title="핀볼" onBack={onBack} onReset={() => { uploadedRef.current = false; reset() }} size="xl" />

        <div className="text-center mb-6">
          <div className="card">
            <p className="muted">점수</p>
            <p className="title-2xl accent">{score}</p>
            <p className="muted mt-2">최고 점수: {highScore}</p>
            <p className="muted">최근: {lastScore}</p>
          </div>
        </div>

        <div className="board-shell pinball-shell" style={{ position: 'relative', width: 'fit-content' }}>
          <canvas ref={canvasRef} width={width} height={height} />

          {/* Overlay pause button */}
          <button
            className="btn btn--ghost pinball-pause"
            onClick={togglePause}
            aria-label={isPaused ? '재생' : '일시정지'}
            style={{ position: 'absolute', top: 8, right: 8 }}
          >
            {isPaused ? '▶' : 'Ⅱ'}
          </button>

          {/* Touch controls: left/right flipper */}
          <div className="pinball-touch-left"
               onTouchStart={pressLeft}
               onTouchEnd={releaseLeft}
               onMouseDown={pressLeft}
               onMouseUp={releaseLeft}
               aria-label="왼쪽 플리퍼"
               role="button"
               />
          <div className="pinball-touch-right"
               onTouchStart={pressRight}
               onTouchEnd={releaseRight}
               onMouseDown={pressRight}
               onMouseUp={releaseRight}
               aria-label="오른쪽 플리퍼"
               role="button"
               />
          <div className="pinball-touch-plunger"
               onTouchStart={pressPlunger}
               onTouchEnd={releasePlunger}
               onMouseDown={pressPlunger}
               onMouseUp={releasePlunger}
               aria-label="플런저"
               role="button"
               />
        </div>

        {gameOver && (
          <div className="text-center mb-4">
            <div className="notice notice--danger">
              <h2 className="title-xl mb-2">게임 오버!</h2>
              <p>최종 점수: {score}</p>
            </div>
          </div>
        )}

        <div className="info-box">
          <p className="mb-2">조작법</p>
          <p>A / ← : 왼쪽 플리퍼</p>
          <p>D / → : 오른쪽 플리퍼</p>
          <p>Space / ↓ : 발사대 충전 후 발사</p>
          <p className="muted-light" style={{ marginTop: 8 }}>모바일: 화면 좌/우 하단 터치로 플리퍼, 우측 하단 세로바 터치로 플런저</p>
        </div>
      </div>
    </div>
  )
}
