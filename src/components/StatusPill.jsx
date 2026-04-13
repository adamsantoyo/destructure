import { getTone } from '../styles/tones'

export default function StatusPill({ children, tone = 'neutral' }) {
  const palette = getTone(tone)

  return (
    <div
      style={{
        padding: '6px 10px',
        borderRadius: 999,
        border: `1px solid ${palette.border}`,
        background: palette.pill,
        color: palette.text,
        fontSize: '0.72rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  )
}
