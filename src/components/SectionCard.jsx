import { getTone } from '../styles/tones'
import styles from './SectionCard.module.css'

export default function SectionCard({ eyebrow, title, tone = 'neutral', style, children }) {
  const palette = getTone(tone)

  return (
    <div
      className={styles.card}
      style={{
        border: `1px solid ${palette.border}`,
        background: palette.background,
        boxShadow: `0 12px 30px ${palette.glow}`,
        ...style,
      }}
    >
      <div className={styles.header}>
        <div className={styles.eyebrow} style={{ color: palette.text }}>{eyebrow}</div>
        <div className={styles.title}>{title}</div>
      </div>
      {children}
    </div>
  )
}
