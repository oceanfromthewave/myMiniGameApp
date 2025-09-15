import React, { useEffect, useState, useCallback } from 'react'
import useVisibilityPause from '../../hooks/useVisibilityPause'
import GameHeader from '../../components/layout/GameHeader'
import use2048 from './use2048'
import Board from './Board'
import Controls from './Controls'
import useSwipe from '../../hooks/useSwipe'
import useSfx from '../../hooks/useSfx'
import useHaptics from '../../hooks/useHaptics'

export default function Game2048({ onBack }) {
  const {
    board, score, highScore, lastScore , gameOver,
    move, reset, undo,
    getTileClass, mergedGrid, lastSpawn,
    combo, comboBonus, comboFlash,
    canUndo
  } = use2048()

  const [isPaused, setIsPaused] = useState(false)

  const safeMove = useCallback((dir) => {
    if (isPaused || gameOver) return
    move(dir)
  }, [isPaused, gameOver, move])

  const swipeRef = useSwipe({ onSwipe: safeMove, threshold: 24, preventScroll: true })

  const sfx = useSfx();
  const haptics = useHaptics();

  useEffect(() => {
    const hadMerge = mergedGrid?.some(row => row.some(Boolean))
    if(hadMerge) {
      sfx.playMerge()
      haptics.vibrate(20)
    }
  }, [mergedGrid])

  useEffect(() => {
  if (lastSpawn) {
      sfx.playSpawn()
      haptics.vibrate(12)
    }
    }, [lastSpawn])


    useEffect(() => {
      const onKey = (e) => {
        const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }
        if (map[e.key]) { e.preventDefault(); safeMove(map[e.key]) }
      }
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }, [safeMove])

    useVisibilityPause(() => setIsPaused(true))

    useEffect(() => {
      if (isPaused) sfx.suspend?.(); else sfx.resume?.();
    }, [isPaused, sfx])

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
            <Controls onMove={safeMove} />
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

        <div className="row-center mb-4">
          <button className="btn btn--warning btn--lg" onClick={() => setIsPaused(p => !p)} aria-label={isPaused ? '재생' : '일시정지'}>
            {isPaused ? '재생' : '일시정지'}
          </button>
        </div>

        {gameOver && (
          <div className="text-center mb-4" role="status" aria-live="assertive">
            <div className="notice notice--danger">
              <h2 className="title-xl mb-2">게임 오버!</h2>
              <p>최종 점수: {score}</p>
            </div>
          </div>
        )}

        {isPaused && !gameOver && (
          <div className="text-center mb-4">
            <div className="notice notice--warning">
              <h2 className="title-xl">일시정지</h2>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
