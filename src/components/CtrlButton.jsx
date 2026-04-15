import { useState } from 'react'
import styles from './CtrlButton.module.css'

export default function CtrlButton({
  label,
  children,
  onClick,
  active = false,
  danger = false,
  small = false,
  disabled = false,
  glow: glowProp = false,
  shortcut,
  icon,
}) {
  const [hover, setHover] = useState(false)
  const [pressed, setPressed] = useState(false)

  const content = label ?? children
  const isLit = active || hover || glowProp || pressed

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false) }}
      onMouseDown={() => { if (!disabled) setPressed(true) }}
      onMouseUp={() => setPressed(false)}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      className={[
        styles.button,
        small ? styles.small : '',
        active || isLit ? styles.active : '',
        danger ? styles.danger : '',
        glowProp ? styles.glow : '',
        disabled ? styles.disabled : '',
      ].filter(Boolean).join(' ')}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span>{content}</span>
      {shortcut && <span className={styles.shortcut}>{shortcut}</span>}
    </button>
  )
}
