import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion' // eslint-disable-line no-unused-vars
import { getDeleteCost, getInsertCost } from '../structures/array'

export default function CellPopover({ cellIndex, arrayLength, position, onDelete, onInsertBefore, onInsertAfter, onClose }) {
  const ref = useRef(null)

  const deleteCost = getDeleteCost(arrayLength, cellIndex)
  const insertBeforeCost = getInsertCost(arrayLength, cellIndex)
  const insertAfterCost = getInsertCost(arrayLength, cellIndex + 1)

  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') onClose() }
    const handleClick = e => { if (ref.current && !ref.current.contains(e.target)) onClose() }

    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClick)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [onClose])

  const costLabel = (cost) => {
    if (cost === 0) return '0 shifts'
    return `${cost} shift${cost !== 1 ? 's' : ''}`
  }

  const costTone = (cost) => cost === 0 ? 'var(--accent)' : cost >= 3 ? 'var(--danger)' : 'var(--text)'

  const items = [
    { label: 'Delete', cost: deleteCost, action: onDelete },
    { label: 'Insert before', cost: insertBeforeCost, action: onInsertBefore },
    { label: 'Insert after', cost: insertAfterCost, action: onInsertAfter },
  ]

  // Position popover above or below cell depending on space
  const popoverAbove = position.y > 200

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92, y: popoverAbove ? 6 : -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        left: position.x,
        top: popoverAbove ? undefined : position.y,
        bottom: popoverAbove ? `calc(100% - ${position.y}px + 8px)` : undefined,
        transform: 'translateX(-50%)',
        zIndex: 50,
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md, 12px)',
        padding: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minWidth: 180,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1)',
      }}
    >
      <div style={{
        padding: '4px 10px 6px',
        fontSize: '0.65rem',
        color: 'var(--text-dim)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        borderBottom: '1px solid var(--border)',
        marginBottom: 2,
      }}>
        index {cellIndex}
      </div>

      {items.map(item => (
        <button
          key={item.label}
          onClick={item.action}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '8px 10px',
            background: 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm, 6px)',
            color: 'var(--text)',
            fontSize: 'var(--size-sm)',
            fontFamily: 'var(--font)',
            cursor: 'pointer',
            transition: 'background 0.12s',
            outline: 'none',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <span>{item.label}</span>
          <span style={{
            fontSize: 'var(--size-xs)',
            fontWeight: 400,
            color: costTone(item.cost),
            fontVariantNumeric: 'tabular-nums',
          }}>
            {costLabel(item.cost)}
          </span>
        </button>
      ))}
    </motion.div>
  )
}
