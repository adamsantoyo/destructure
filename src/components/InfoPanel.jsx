import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import { STRUCTURE_INFO } from '../data/dictionary'

/* ── Section primitives ── */

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)',
        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8,
      }}>
        {title}
      </div>
      <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  )
}

function Rule({ label, children }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <span style={{ color: 'var(--text)', fontWeight: 700 }}>{label}</span>{' '}
      <span>{children}</span>
    </div>
  )
}

function CostRow({ op, best, worst, note }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4,
      fontSize: '0.72rem',
    }}>
      <span style={{ color: 'var(--text)', fontWeight: 700, minWidth: 60 }}>{op}</span>
      <span style={{ color: 'var(--accent)' }}>{best}</span>
      {worst && <span style={{ color: 'var(--danger)' }}>→ {worst}</span>}
      {note && <span style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>({note})</span>}
    </div>
  )
}

/* ── InfoPanel component ── */

export default function InfoPanel({ structureId, open, onClose }) {
  const info = STRUCTURE_INFO[structureId]
  if (!info) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="info-panel-container"
        >
          <div className="info-panel-scroll">
            {/* Header */}
            <div className="info-panel-header">
              <div>
                <div className="info-panel-subtitle">
                  Reference
                </div>
                <div className="info-panel-title">
                  {info.name}
                </div>
              </div>
              <button onClick={onClose} className="info-panel-close">
                &times;
              </button>
            </div>

            {/* What is it */}
            <Section title="What is it">
              {info.what}
            </Section>

            {/* Rules */}
            <Section title="Rules">
              {info.rules.map((r, i) => (
                <Rule key={i} label={r.label}>{r.text}</Rule>
              ))}
            </Section>

            {/* Operations */}
            <Section title="Operations">
              {info.ops.map((o, i) => (
                <CostRow key={i} op={o.op} best={o.best} worst={o.worst} note={o.note} />
              ))}
            </Section>

            {/* Why */}
            <Section title="Why does it cost that">
              {info.why}
            </Section>

            {/* Real world */}
            <Section title="Real-world uses">
              {info.realWorld}
            </Section>

            {/* Tradeoff */}
            <Section title="The tradeoff">
              <div style={{ color: 'var(--text)', fontWeight: 400, fontStyle: 'italic' }}>
                {info.tradeoff}
              </div>
            </Section>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
