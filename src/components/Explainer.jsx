import { AnimatePresence, motion } from 'framer-motion' // eslint-disable-line no-unused-vars
import { getTone } from '../styles/tones'
import styles from './Explainer.module.css'

const TONE_ICONS = {
  accent: 'i',
  neutral: 'i',
  muted: 'i',
  danger: '!',
  success: '+',
}

export default function Explainer({ eyebrow, text, detail, tone = 'accent', compact = false }) {
  const palette = getTone(tone)

  return (
    <div className={styles.wrap}>
      <AnimatePresence mode="wait">
        {text && (
          <motion.div
            key={eyebrow ?? ''}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className={`${styles.card} ${compact ? styles.compact : ''}`}
            style={{
              '--tone-text': palette.text,
              '--tone-border': palette.border,
              '--tone-background': palette.background,
              '--tone-glow': palette.glow,
            }}
          >
            <div className={styles.icon}>{TONE_ICONS[tone] ?? 'i'}</div>
            <div className={styles.content}>
              {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
              <div className={styles.text}>{text}</div>
              {detail && <div className={styles.detail}>{detail}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
