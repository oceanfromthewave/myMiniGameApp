import React from 'react'

export default function Tile({ value, getTileClass, isMerged=false, isSpawn=false }) {
  const classes = [
    'tile',
    getTileClass(value),
    isMerged ? 'tile--merge' : '',
    isSpawn ? 'tile--spawn' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      {value !== 0 ? value : ''}
    </div>
  )
}
