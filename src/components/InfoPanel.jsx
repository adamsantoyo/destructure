import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import { STRUCTURE_INFO } from '../data/dictionary'
import CloseIcon from './CloseIcon'
import styles from './InfoPanel.module.css'

function Section({ title, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>{title}</div>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  )
}

function Rule({ label, children }) {
  return (
    <div className={styles.rule}>
      <strong>{label}</strong>{' '}
      <span>{children}</span>
    </div>
  )
}

function CostRow({ op, best, worst, note }) {
  return (
    <div className={styles.costRow}>
      <span className={styles.costLabel}>{op}</span>
      <span>
        <span style={{ color: 'var(--accent)' }}>{best}</span>
        {worst && <span style={{ color: 'var(--danger)' }}> → {worst}</span>}
        {note && <span style={{ color: 'var(--text-secondary)' }}> ({note})</span>}
      </span>
    </div>
  )
}

export default function InfoPanel({ structureId, open, onClose }) {
  const info = STRUCTURE_INFO[structureId]
  if (!info) return null

  return (
    <AnimatePresence initial={false}>
      {open && (
        <div className={styles.shell}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className={styles.backdrop}
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            className={styles.panel}
          >
            <div className={styles.header}>
              <div>
                <div className={styles.eyebrow}>Reference drawer</div>
                <div className={styles.title}>{info.name}</div>
                <div className={styles.subtitle}>Open while you experiment so the explanation stays visible instead of buried behind the active scene.</div>
              </div>
              <button type="button" onClick={onClose} className={styles.close} aria-label="Close reference drawer">
                <CloseIcon />
              </button>
            </div>

            <div className={styles.scroll}>
              <Section title="What is it">{info.what}</Section>

              <Section title="Rules">
                {info.rules.map((r, i) => (
                  <Rule key={i} label={r.label}>{r.text}</Rule>
                ))}
              </Section>

              <Section title="Operations">
                {info.ops.map((o, i) => (
                  <CostRow key={i} op={o.op} best={o.best} worst={o.worst} note={o.note} />
                ))}
              </Section>

              <Section title="Why does it cost that">{info.why}</Section>
              <Section title="Real-world uses">{info.realWorld}</Section>
              <Section title="The tradeoff">
                <div className={styles.tradeoff}>{info.tradeoff}</div>
              </Section>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
