import React from 'react'
import GameHeader from '../../components/layout/GameHeader'
import useBrickBreaker from './useBrickBreaker'

export default function BrickBreakerGame({ onBack }) {
  const { canvasRef, score, gameOver, reset, movePaddle } = useBrickBreaker()

  return (
    <div className="screen">
      <div className="container">
        <GameHeader title="벽돌깨기" onBack={onBack} onReset={reset} />

        <div className="text-center mb-6">
          <div className="card">
            <p className="muted">점수</p>
            <p className="title-2xl accent">{score}</p>
          </div>
        </div>

        <div className="board-shell" style={{ width: 'fit-content' }}>
          <canvas ref={canvasRef} width={480} height={320} />
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
            <button className="btn btn--square" onClick={() => movePaddle('left')}>←</button>
            <button className="btn btn--square" onClick={() => movePaddle('right')}>→</button>
          </div>
        </div>

        <div className="info-box">
          <p className="mb-2">조작법</p>
          <p>← →: 좌우 이동</p>
          <p className="mt-2 muted-light">목표: 모든 벽돌을 제거하세요!</p>
        </div>
      </div>
    </div>
  )
}