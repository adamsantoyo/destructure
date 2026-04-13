import { getTone } from '../styles/tones'

export default function SectionCard({ eyebrow, title, tone = 'neutral', style, children }) {
  const palette = getTone(tone)

  return (
    <div
      style={{
        borderRadius: 18,
        border: `1px solid ${palette.border}`,
        background: palette.background,
        boxShadow: `0 12px 30px ${palette.glow}`,
        padding: '16px 18px',
        ...style,
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <div
          style={{
            fontSize: '0.72rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: palette.text,
            marginBottom: 6,
          }}
        >
          {eyebrow}
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>{title}</div>
      </div>
      {children}
    </div>
  )
}
