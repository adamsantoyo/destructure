import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars

export default function OperationHistory({ history }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history.length])

  if (!history.length) return null

  const maxCost = Math.max(...history.map(h => h.cost), 1)

  return (
    <div style={{ width: '100%', maxWidth: 700 }}>
      <div style={{
        fontSize: '0.65rem',
        color: 'var(--text-dim)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: 8,
      }}>
        Operations
      </div>

      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          maxHeight: 200,
          overflowY: 'auto',
          scrollBehavior: 'smooth',
        }}
      >
        <AnimatePresence initial={false}>
          {history.map((entry, i) => {
            const barPct = maxCost > 0 ? (entry.cost / maxCost) * 100 : 0
            const isDanger = entry.cost > 1
            const color = isDanger ? 'var(--danger)' : 'var(--accent)'
            const bgColor = isDanger
              ? 'rgba(255,51,102,0.2)'
              : 'rgba(0,255,200,0.2)'

            return (
              <motion.div
                key={entry.id ?? i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 70px',
                  alignItems: 'center',
                  gap: 10,
                  padding: '5px 0',
                  fontSize: 'var(--size-xs)',
                }}
              >
                {/* Label */}
                <span style={{ color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span style={{ color, fontWeight: 500 }}>{entry.action}</span>
                  {' '}
                  <span style={{ opacity: 0.6 }}>[{entry.index}]</span>
                  {' '}
                  &ldquo;{entry.label}&rdquo;
                </span>

                {/* Bar */}
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barPct}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
                    style={{ height: '100%', borderRadius: 3, background: bgColor }}
                  />
                </div>

                {/* Cost */}
                <span style={{ textAlign: 'right', color, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                  {entry.cost} {entry.cost === 1 ? 'shift' : 'shifts'}
                </span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
