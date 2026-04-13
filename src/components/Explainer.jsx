import { AnimatePresence, motion } from 'framer-motion' // eslint-disable-line no-unused-vars
import { getTone } from '../styles/tones'

export default function Explainer({ eyebrow, text, detail, tone = 'accent' }) {
  const palette = getTone(tone)

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <AnimatePresence mode="wait">
        {text && (
          <motion.div
            key={`${eyebrow ?? ''}-${text}-${detail ?? ''}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            style={{
              width: 'min(760px, 100%)',
              minHeight: '5.5rem',
              padding: '16px 18px',
              borderRadius: 16,
              border: `1px solid ${palette.border}`,
              borderLeft: `4px solid ${palette.text}`,
              background: palette.background,
              boxShadow: `0 10px 30px ${palette.glow}`,
              textAlign: 'left',
            }}
          >
            {eyebrow && (
              <div style={{
                marginBottom: 8,
                fontSize: '0.72rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: palette.text,
              }}>
                {eyebrow}
              </div>
            )}

            <div style={{
              fontSize: '1.05rem',
              fontWeight: 400,
              color: 'var(--text)',
              lineHeight: 1.55,
            }}>
              {text}
            </div>

            {detail && (
              <div style={{
                marginTop: 8,
                fontSize: 'var(--size-sm)',
                fontWeight: 300,
                color: 'var(--text-dim)',
                lineHeight: 1.5,
              }}>
                {detail}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
