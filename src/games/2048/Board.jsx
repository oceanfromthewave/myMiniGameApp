import React from 'react'
import Tile from './Tile'

export default function Board({ board, getTileClass, mergedGrid, lastSpawn }) {
  return (
    <div className="panel">
      <div className="grid-4">
        {board.map((row, i) =>
          row.map((cell, j) => {
            const isMerged = mergedGrid?.[i]?.[j]
            const isSpawn = !!(lastSpawn && lastSpawn[0]===i && lastSpawn[1]===j)
            return (
              <Tile
                key={`${i}-${j}`}
                value={cell}
                getTileClass={getTileClass}
                isMerged={isMerged}
                isSpawn={isSpawn}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
