import { useState } from 'react'

export default function CtrlButton({ label, onClick, active = false, danger = false, small = false, disabled = false, glow: glowProp = false, shortcut }) {
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
      aria-disabled={disabled || undefined}
      style={{
        background: isInverted ? accent : 'transparent',
        border: `1px solid ${isLit ? accent : 'var(--border)'}`,
        color: isInverted ? 'var(--bg)' : isLit ? accent : 'var(--text-dim)',
        borderRadius: 'var(--radius-pill)',
        padding: small ? '4px 12px' : '6px 18px',
        fontSize: small ? 'var(--size-xs)' : 'var(--size-sm)',
        fontWeight: 400,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all var(--ease-fast)',
        boxShadow: glowProp
          ? `0 0 14px ${glowColor}, 0 0 4px ${glowColor}`
          : isLit ? `0 0 10px ${glowColor}` : 'none',
        whiteSpace: 'nowrap',
        opacity: disabled ? 0.45 : 1,
        outline: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {label}
      {shortcut && (
        <span style={{
          fontSize: '0.6rem',
          opacity: 0.5,
          letterSpacing: '0.05em',
          marginLeft: 2,
        }}>
          {shortcut}
        </span>
      )}
    </button>
  )
}
