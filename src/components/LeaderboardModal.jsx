import React from 'react'
import Leaderboard from './Leaderboard'
import { X } from 'lucide-react'

export default function LeaderboardModal({ game, onClose }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="lb-title">
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h2 id="lb-title" className="modal-title">리더보드</h2>
          <button className="btn" onClick={onClose} aria-label="닫기"><X size={16} /></button>
        </div>
        <div className="modal-body">
          <Leaderboard game={game} />
        </div>
      </div>
    </div>
  )
}