import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars

const REMOVAL_ACTIONS = new Set(['Delete', 'Pop', 'Dequeue'])

function HistoryRow({ item }) {
  const isExpensive = item.cost > 1
  const costLabel = item.costText
    || (item.cost === 0 ? 'O(1)' : `${item.cost} ${item.unit || 'op'}${item.cost !== 1 ? 's' : ''}`)
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '4px 0',
        fontSize: '0.72rem',
        color: 'var(--text-dim)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <span style={{
        color: REMOVAL_ACTIONS.has(item.action) ? 'var(--danger)' : 'var(--accent)',
        minWidth: 48,
        fontWeight: 700,
      }}>
        {item.action}
      </span>
      <span style={{ color: 'var(--text)', minWidth: 36 }}>"{item.label}"</span>
      {item.location != null && <span>{item.location}</span>}
      <span style={{
        marginLeft: 'auto',
        color: isExpensive ? 'var(--danger)' : 'var(--accent)',
        fontWeight: 700,
      }}>
        {costLabel}
      </span>
    </motion.div>
  )
}

export default function OperationHistory({ history }) {
  if (!history.length) return null

  return (
    <div style={{
      width: '100%',
      maxWidth: 520,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 16px',
    }}>
      <div style={{
        fontSize: '0.65rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-dim)',
        marginBottom: 8,
      }}>
        Operation history
      </div>
      <AnimatePresence initial={false}>
        {[...history].reverse().slice(0, 6).map(item => (
          <HistoryRow key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </div>
  )
}
