import { useState } from 'react'

export default function CtrlButton({ label, onClick, active = false, danger = false, small = false, disabled = false, glow: glowProp = false }) {
  const [hover, setHover] = useState(false)
  const [pressed, setPressed] = useState(false)

  const accent = danger ? 'var(--danger)' : 'var(--accent)'
  const glowColor = danger ? 'var(--danger-glow)' : 'var(--accent-glow)'

  const isLit = active || hover || glowProp
  const isInverted = pressed || active

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false) }}
      onMouseDown={() => { if (!disabled) setPressed(true) }}
      onMouseUp={() => setPressed(false)}
      disabled={disabled}
      style={{
        background: isInverted ? accent : 'transparent',
        border: `1px solid ${isLit ? accent : 'var(--border)'}`,
        color: isInverted ? 'var(--bg)' : isLit ? accent : 'var(--text-dim)',
        borderRadius: '999px',
        padding: small ? '4px 12px' : '6px 18px',
        fontSize: small ? 'var(--size-xs)' : 'var(--size-sm)',
        fontWeight: 400,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.15s',
        boxShadow: glowProp
          ? `0 0 14px ${glowColor}, 0 0 4px ${glowColor}`
          : isLit ? `0 0 10px ${glowColor}` : 'none',
        whiteSpace: 'nowrap',
        opacity: disabled ? 0.35 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      {label}
    </button>
  )
}
