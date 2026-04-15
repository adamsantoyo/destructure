import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import { useId, useMemo, useState } from 'react'
import styles from './OperationHistory.module.css'

const REMOVAL_ACTIONS = new Set(['Delete', 'Pop', 'Dequeue'])
const ADD_ACTIONS = new Set(['Insert', 'Push', 'Enqueue'])

function HistoryRow({ item }) {
  const isExpensive = item.cost > 1
  const costLabel = item.costText
    || (item.cost === 0 ? 'O(1)' : `${item.cost} ${item.unit || 'op'}${item.cost !== 1 ? 's' : ''}`)
  const toneClass = isExpensive ? styles.costDanger : styles.costAccent
  const actionClass = REMOVAL_ACTIONS.has(item.action) ? styles.actionRemove : styles.actionAdd
  const actionIcon = REMOVAL_ACTIONS.has(item.action) ? '-' : ADD_ACTIONS.has(item.action) ? '+' : '?'

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className={styles.row}
    >
      <div className={`${styles.action} ${actionClass}`}>
        <span className={styles.icon}>{actionIcon}</span>
        <span>{item.action}</span>
      </div>
      <div className={styles.details}>
        <div className={styles.label}>"{item.label}"</div>
        {item.location != null && <div className={styles.location}>{item.location}</div>}
      </div>
      <div className={`${styles.cost} ${toneClass}`}>{costLabel}</div>
    </motion.div>
  )
}

export default function OperationHistory({ history }) {
  const [open, setOpen] = useState(() => history.length <= 3)
  const contentId = useId()

  const summary = useMemo(() => {
    const totalCost = history.reduce((sum, item) => sum + (item.cost ?? 0), 0)
    const avgCost = history.length ? totalCost / history.length : 0
    return { totalCost, avgCost }
  }, [history])

  if (!history.length) return null

  return (
    <div className={styles.drawer}>
      <button
        type="button"
        className={styles.summaryButton}
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        aria-controls={contentId}
      >
        <div className={styles.titleBlock}>
          <div className={styles.eyebrow}>History drawer</div>
          <div className={styles.title}>Operation history</div>
          <div className={styles.subtitle}>Review patterns instead of losing them in a passive log.</div>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{history.length}</div>
            <div className={styles.statLabel}>ops</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{summary.totalCost}</div>
            <div className={styles.statLabel}>total cost</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{summary.avgCost.toFixed(1)}</div>
            <div className={styles.statLabel}>avg cost</div>
          </div>
          <div className={styles.chevron} aria-hidden="true">{open ? '▴' : '▾'}</div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={styles.content}
            id={contentId}
          >
            <div className={styles.list}>
              {[...history].reverse().map(item => (
                <HistoryRow key={item.id} item={item} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
