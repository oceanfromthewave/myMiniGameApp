import React from 'react'
import { getTop } from '../utils/leaderboard'
import { getDeviceId } from '../utils/device'

export default function Leaderboard({ game, initialLimit = 10, limit, compact = false }) {
  const effectiveInitial = limit ?? initialLimit
  const [rows, setRows] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [scope, setScope] = React.useState('all') // all | today | week
  const [byDevice, setByDevice] = React.useState(false)
  const [fetchLimit, setFetchLimit] = React.useState(effectiveInitial)
  const [showCount, setShowCount] = React.useState(3)
  const myId = React.useMemo(() => getDeviceId(), [])

  const load = React.useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const { data, error } = await getTop({ game, limit: fetchLimit, scope, byDevice })
      if (error) throw error
      setRows(data || [])
    } catch (e) {
      setError('랭킹을 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }, [game, fetchLimit, scope, byDevice])

  React.useEffect(() => { setFetchLimit(effectiveInitial) }, [effectiveInitial])
  React.useEffect(() => { setShowCount(3) }, [game, scope, byDevice])
  React.useEffect(() => { load() }, [load])

  const visible = rows.slice(0, compact ? 3 : showCount)
  const isExpanded = showCount >= 10

  const rankBadge = (i) => {
    const cls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''
    return (
      <span className={`lb-rank ${cls}`} aria-label={`${i + 1}위`}>
        {i < 3 ? '' : i + 1}
      </span>
    )
  }

  return (
    <div className="card lb-card" aria-live="polite">
      <div className="hstack-4" style={{ justifyContent: 'space-between' }}>
        <h3 className="title-l" style={{ margin: 0 }}>리더보드</h3>
        {!compact && (
          <div className="hstack-4 lb-controls">
            <button className="btn btn--ghost" onClick={() => setScope('all')} aria-pressed={scope==='all'}>전체</button>
            <button className="btn btn--ghost" onClick={() => setScope('today')} aria-pressed={scope==='today'}>오늘</button>
            <button className="btn btn--ghost" onClick={() => setScope('week')} aria-pressed={scope==='week'}>주간</button>
            <button className="btn btn--ghost" onClick={() => setByDevice(v=>!v)} aria-pressed={byDevice}>장치별</button>
            <button className="btn btn--ghost" onClick={load} aria-label="랭킹 새로고침">⟳</button>
          </div>
        )}
      </div>
      {loading && <p className="muted mt-2">불러오는 중...</p>}
      {error && <p className="muted mt-2">{error}</p>}
      {!loading && !error && (
        <>
          <ol className="lb-list" style={{ listStyle: 'none', padding: 0, margin: '12px 0 0 0' }}>
            {rows.length === 0 && <p className="muted">아직 기록이 없습니다</p>}
            {visible.map((r, i) => {
              const mine = r.device_id === myId
              return (
                <li key={i} className={`lb-row ${mine ? 'lb-row--mine' : ''}`}>
                  <div className="lb-left">
                    {rankBadge(i)}
                    <span className="lb-name">{r.username}</span>
                  </div>
                  <span className="lb-score">{r.score}</span>
                </li>
              )}
            )}
          </ol>
          {!compact && (
            <div className="row-center mt-2">
              {rows.length > 0 && (
                <button className="btn btn--ghost" onClick={() => setShowCount(c => (c < 10 ? 10 : 3))}>{isExpanded ? '접기' : '더보기'}</button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}