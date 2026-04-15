import { getTone } from '../styles/tones'
import styles from './StatusPill.module.css'

export default function StatusPill({ tone = 'accent', children }) {
  const palette = getTone(tone)
  return (
    <div
      className={styles.pill}
      style={{
        '--tone-text': palette.text,
        '--tone-border': palette.border,
        '--tone-background': palette.background,
      }}
    >
      <span className={styles.dot} />
      {children}
    </div>
  )
}
