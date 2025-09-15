import React, { useEffect } from 'react'
import GameHeader from '../../components/layout/GameHeader'
import use2048 from './use2048'
import Board from './Board'
import Controls from './Controls'
import useSwipe from '../../hooks/useSwipe'
import useSfx from '../../hooks/useSfx'

export default function Game2048({ onBack }) {
  const {
    board, score, highScore, lastScore , gameOver,
    move, reset, undo,
    getTileClass, mergedGrid, lastSpawn,
    combo, comboBonus, comboFlash,
    canUndo
  } = use2048()

  const swipeRef = useSwipe({
    onSwipe: move,
    threshold: 24,
    preventScroll: true,
  })

  const sfx = useSfx();

  useEffect(() => {
    const hadMerge = mergedGrid?.some(row => row.some(Boolean))
    if(hadMerge) {
      sfx.playMerge()
      if (navigator.vibrate) navigator.vibrate(20)
    }
  }, [mergedGrid])

  useEffect(() => {
  if (lastSpawn) sfx.playSpawn()
    }, [lastSpawn])


  useEffect(() => {
    const onKey = (e) => {
      const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }
      if (map[e.key]) { e.preventDefault(); move(map[e.key]) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [move])

  return (
    <div className="screen">
      <div className="container">
        <GameHeader title="2048" onBack={onBack} onReset={reset} />
        
        <div className="text-center mb-6">
          <div className="card">
            <p className="muted">점수</p>
            <p className="title-2xl accent">{score}</p>
            <p className="muted mt-2">최고: {highScore}</p>
            <p className='muted'>최근: {lastScore}</p>
          </div>
        </div>

        <div ref={swipeRef} className="touch-area">
          {/* 콤보 배지 */}
          {combo > 0 && comboBonus > 0 && (
            <div key={comboFlash} className="combo-badge">
              Combo x{combo} +{comboBonus}
            </div>
          )}

          <Board
            board={board}
            getTileClass={getTileClass}
            mergedGrid={mergedGrid}
            lastSpawn={lastSpawn}
          />

          {/* 컨트롤 + UNDO 버튼 */}
          <div className="hstack-4 mt-2 row-center">
            <Controls onMove={move} />
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="btn"
              title="직전 한 턴을 되돌리기"
              aria-label="되돌리기"
            >
              UNDO
            </button>
          </div>
        </div>

        {gameOver && (
          <div className="text-center mb-4" role="status" aria-live="assertive">
            <div className="notice notice--danger">
              <h2 className="title-xl mb-2">게임 오버!</h2>
              <p>최종 점수: {score}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
