import { getTone } from '../styles/tones'

export default function StatusPill({ tone = 'accent', children }) {
  const palette = getTone(tone)
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: 'var(--radius-pill)',
      border: `1px solid ${palette.border}`,
      background: palette.background,
      fontSize: '0.7rem',
      fontWeight: 400,
      color: palette.text,
      letterSpacing: '0.06em',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </div>
  )
}
