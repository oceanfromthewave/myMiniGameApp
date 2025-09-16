import React from 'react'
import { X, Vibrate, Volume2, Download } from 'lucide-react'
import useTheme from '../../hooks/useTheme'
import useSfx from '../../hooks/useSfx'
import useHaptics from '../../hooks/useHaptics'
import usePwaInstall from '../../hooks/usePwaInstall'
import { getUsername, setUsername } from '../../utils/device'


export default function SettingsModal({ onClose }) {
  const { theme, toggleTheme } = useTheme()
  const sfx = useSfx()
  const haptics = useHaptics()
  const { canInstall, install } = usePwaInstall()
  const [name, setName] = React.useState(getUsername())
  const [savedAt, setSavedAt] = React.useState(0)

  const onSaveName = () => {
    const v = (name || '').trim()

    setUsername(v || '익명')
    setUsername(v || '익명')
    setSavedAt(Date.now())
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="modal">
        <div className="modal-header">
          <h2 id="settings-title" className="modal-title">설정</h2>
          <button className="btn" onClick={onClose} aria-label="닫기"><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="hstack-4">
            <span>테마</span>
            <button className="btn" onClick={toggleTheme}>현재: {theme}</button>
          </div>
          <div className="hstack-4">
            <span className="hstack-4"><Volume2 size={16} /> SFX</span>
            <button className="btn" onClick={sfx.toggle}>{sfx.enabled ? '켜짐' : '꺼짐'}</button>
          </div>
          <div className="hstack-4">
            <span className="hstack-4"><Vibrate size={16} /> 햅틱</span>
            <button className="btn" onClick={haptics.toggle}>{haptics.enabled ? '켜짐' : '꺼짐'}</button>
          </div>
                    <div className="form-row">
            <label htmlFor="username">닉네임</label>
            <input
              id="username"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSaveName() }}
              maxLength={20}
              placeholder="닉네임 입력 (최대 20자)"
              aria-label="닉네임 입력"
            />
            <button className="btn btn--primary" onClick={onSaveName} aria-label="닉네임 저장">저장</button>
          </div>
          {savedAt ? <p className="hint">저장됨</p> : null}
          {canInstall && (
            <div className="hstack-4">
              <span className="hstack-4"><Download size={16} /> 설치</span>
              <button className="btn btn--primary" onClick={install}>PWA 설치</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
