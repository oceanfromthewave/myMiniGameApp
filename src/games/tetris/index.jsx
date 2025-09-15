import React from 'react'
import GameHeader from '../../components/layout/GameHeader'
import useTetris from './useTetris'
import useVisibilityPause from '../../hooks/useVisibilityPause'

export default function TetrisGame({ onBack }) {
  const {
    score,
    highScore,
    lastScore,
    lines,
    level,
    isPaused,
    gameOver,
    movePiece,
    togglePause,
    reset,
    renderBoard,
    getCellClass,
    clearingRows,
    clearBlink,
  } = useTetris()

  useVisibilityPause(() => {
    if (!isPaused) togglePause()
  })

  React.useEffect(() => {
    const onKey = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault()
      }
      if (e.key === 'ArrowLeft') movePiece('left')
      else if (e.key === 'ArrowRight') movePiece('right')
      else if (e.key === 'ArrowDown') movePiece('down')
      else if (e.key === 'ArrowUp') movePiece('rotate')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [movePiece])

  const board = renderBoard()

  return (
    <div className="screen">
      <div className="container">
        <GameHeader title="테트리스" onBack={onBack} onReset={reset} size="xl" />

        <div className="hud-grid">
          <div className="hud-card">
            <p className="muted-light">점수</p>
            <p>{score}</p>
            <p className="muted-light mt-2">최고 점수: {highScore}</p>
            <p className="muted-light">최근: {lastScore}</p>
          </div>
          <div className="hud-card">
            <p className="muted-light">레벨</p>
            <p>{level}</p>
          </div>
          <div className="hud-card">
            <p className="muted-light">라인</p>
            <p>{lines}</p>
          </div>
        </div>

        <div className="board-shell" style={{ width: 'fit-content' }}>
          <div className="tetris-grid">
            {board.map((row, i) =>
              row.map((cell, j) => {
                const blinking = clearingRows.includes(i) && (clearBlink === 1)
                return (
                  <div
                    key={`${i}-${j}`}
                    className={`tetris-cell ${getCellClass(cell)} ${blinking ? 'tcell-blink' : ''}`}
                  />
                )
              })
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="row-center mb-4">
            <button className="btn btn--blue btn--wide" onClick={() => movePiece('rotate')} aria-label="블록 회전">회전</button>
          </div>
          <div className="grid-3">
            <button className="btn btn--square" onClick={() => movePiece('left')} aria-label="왼쪽으로 이동">←</button>
            <button className="btn btn--danger btn--square" onClick={() => movePiece('down')} aria-label="아래로 이동">↓</button>
            <button className="btn btn--square" onClick={() => movePiece('right')} aria-label="오른쪽으로 이동">→</button>
          </div>
        </div>

        <div className="row-center mb-4">
          <button className="btn btn--warning btn--lg" onClick={togglePause} aria-label={isPaused ? '재생' : '일시정지'}>{isPaused ? '재생' : '일시정지'}</button>
        </div>

        {gameOver && (
          <div className="text-center mb-4" role="status" aria-live="assertive">
            <div className="notice notice--danger">
              <h2 className="title-xl mb-2">게임 오버!</h2>
              <p>최종 점수: {score}</p>
              <p>클리어한 라인: {lines}</p>
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

        <div className="info-box">
          <p className="mb-2">조작법</p>
          <p>← →: 좌우 이동</p>
          <p>↓: 빠른 하강</p>
          <p>회전: 블록 회전</p>
          <p className="mt-2 muted-light">목표: 빈칸이 없도록 채워보세요!</p>
        </div>
      </div>
    </div>
  )
}

