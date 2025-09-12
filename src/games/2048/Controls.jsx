
import React from 'react'
export default function Controls({ onMove }) {
  return (
    <div className="vstack-4">
      <div className="text-center muted mb-4">방향키 또는 버튼을 사용해 플레이하세요</div>
      <div className="grid-3">
        <div></div><button className="btn btn--square" onClick={() => onMove('up')}>↑</button><div></div>
        <button className="btn btn--square" onClick={() => onMove('left')}>←</button><div></div><button className="btn btn--square" onClick={() => onMove('right')}>→</button>
        <div></div><button className="btn btn--square" onClick={() => onMove('down')}>↓</button><div></div>
      </div>
    </div>
  )
}
