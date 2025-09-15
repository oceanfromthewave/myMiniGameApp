import React from 'react'
import { X, Vibrate, Volume2, Download } from 'lucide-react'
import useTheme from '../../hooks/useTheme'
import useSfx from '../../hooks/useSfx'
import useHaptics from '../../hooks/useHaptics'
import usePwaInstall from '../../hooks/usePwaInstall'

export default function SettingsModal({ onClose }) {
  const { theme, toggleTheme } = useTheme()
  const sfx = useSfx()
  const haptics = useHaptics()
  const { canInstall, install } = usePwaInstall()

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
