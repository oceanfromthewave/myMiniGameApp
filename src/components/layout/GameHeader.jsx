import React from 'react'
import { ChevronLeft, RotateCcw } from 'lucide-react'

export default function GameHeader({ title, onBack, onReset, size = 'l' }) {
  return (
    <div className="bar">
      <button className="btn" onClick={onBack} aria-label="뒤로 가기">
        <ChevronLeft size={20} />
        <span>뒤로</span>
      </button>
      <h1 className={size === 'xl' ? 'title-xl' : 'title-l'}>{title}</h1>
      <button className="btn btn--primary" onClick={onReset} aria-label="리셋">
        <RotateCcw size={20} />
      </button>
    </div>
  )
}

