import { motion } from 'framer-motion' // eslint-disable-line no-unused-vars

function PopoverRow({ label, cost, costUnit, onClick, danger }) {
  const color = danger ? 'var(--danger)' : 'var(--accent)'
  const bg    = danger ? 'rgba(255,51,102,0.06)' : 'rgba(0,255,200,0.06)'
  const unit  = costUnit || 'shift'

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        padding: '8px 12px',
        background: 'transparent',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        color: 'var(--text)',
        fontSize: '0.8rem',
        fontFamily: 'var(--font)',
        gap: 24,
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = bg}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span>{label}</span>
      <span style={{
        fontSize: '0.7rem',
        color,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}>
        {cost === 0 ? 'O(1)' : `${cost} ${unit}${cost !== 1 ? 's' : ''}`}
      </span>
    </button>
  )
}

export default function CellPopover({ cellIndex, position, onDelete, onInsertBefore, onInsertAfter, onClose, deleteCost, insertBeforeCost, insertAfterCost, costUnit }) {

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 10 }}
      />

      {/* Popover */}
      <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          transform: 'translateX(-50%)',
          zIndex: 20,
          background: 'rgba(10,10,20,0.96)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '6px',
          minWidth: 200,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Cell label */}
        <div style={{
          padding: '4px 12px 8px',
          fontSize: '0.68rem',
          color: 'var(--text-dim)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          borderBottom: '1px solid var(--border)',
          marginBottom: 4,
        }}>
          index {cellIndex}
        </div>

        <PopoverRow
          label="Delete"
          cost={deleteCost}
          costUnit={costUnit}
          onClick={onDelete}
          danger={deleteCost > 0}
        />
        <PopoverRow
          label="Insert before"
          cost={insertBeforeCost}
          costUnit={costUnit}
          onClick={onInsertBefore}
          danger={insertBeforeCost > 1}
        />
        <PopoverRow
          label="Insert after"
          cost={insertAfterCost}
          costUnit={costUnit}
          onClick={onInsertAfter}
          danger={insertAfterCost > 1}
        />
      </motion.div>
    </>
  )
}
