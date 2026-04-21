import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion' // eslint-disable-line no-unused-vars
import styles from './CellPopover.module.css'
import { getSmartPosition } from '../utils/smartPosition'

function costColor(cost, maxCost) {
  if (cost === 0) return 'var(--success)'
  if (cost >= Math.max(2, maxCost)) return 'var(--danger)'
  return 'var(--accent)'
}

function PopoverRow({ label, preview, cost, costUnit, costLabel, onClick, icon, maxCost, disabled = false }) {
  const unit = costUnit || 'shift'
  const color = costColor(cost, maxCost)
  const resolvedCost = costLabel ?? (cost === 0 ? 'O(1)' : `${cost} ${unit}${cost !== 1 ? 's' : ''}`)

  return (
    <button type="button" onClick={disabled ? undefined : onClick} className={styles.row} disabled={disabled}>
      <span className={styles.rowIcon}>{icon}</span>
      <span className={styles.rowCopy}>
        <span className={styles.rowLabel}>{label}</span>
        <span className={styles.rowPreview}>{preview}</span>
      </span>
      <span className={styles.cost} style={{ color }}>
        {resolvedCost}
      </span>
    </button>
  )
}

export default function CellPopover({
  cellIndex,
  position,
  onDelete,
  onInsertBefore,
  onInsertAfter,
  onClose,
  deleteCost,
  insertBeforeCost,
  insertAfterCost,
  costUnit,
  eyebrow = 'Cell actions',
  title,
  rows,
}) {
  const popoverRef = useRef(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)

  useEffect(() => {
    if (popoverRef.current && position) {
      const smartPos = getSmartPosition({
        x: position.x,
        y: position.y,
        element: popoverRef.current,
        preferredPosition: 'bottom',
      })
      setAdjustedPosition({ x: smartPos.x, y: smartPos.y })
    }
  }, [position])

  useEffect(() => {
    function handleKeydown(event) {
      if (event.key === 'Escape') onClose?.()
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [onClose])

  const actionRows = useMemo(() => {
    if (rows?.length) return rows

    return [
      {
        label: 'Delete',
        preview: 'Remove this cell and let the structure repair the gap.',
        cost: deleteCost,
        costUnit,
        onClick: onDelete,
        icon: '-',
      },
      {
        label: 'Insert before',
        preview: 'Place a new item ahead of this one and watch the surrounding work.',
        cost: insertBeforeCost,
        costUnit,
        onClick: onInsertBefore,
        icon: '<',
      },
      {
        label: 'Insert after',
        preview: 'Place a new item after this cell and compare the ripple.',
        cost: insertAfterCost,
        costUnit,
        onClick: onInsertAfter,
        icon: '>',
      },
    ].filter(row => typeof row.onClick === 'function')
  }, [costUnit, deleteCost, insertAfterCost, insertBeforeCost, onDelete, onInsertAfter, onInsertBefore, rows])

  const maxCost = Math.max(...actionRows.map(row => row.cost ?? 0), 0)
  const heading = title ?? (cellIndex != null ? `Index ${cellIndex}` : 'Actions')

  return (
    <>
      <div onClick={onClose} className={styles.backdrop} role="presentation" />

      <motion.div
        ref={popoverRef}
        initial={{ opacity: 0, y: -6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={styles.popover}
        role="dialog"
        aria-label={heading}
        style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
      >
        <div className={styles.header}>
          <div className={styles.eyebrow}>{eyebrow}</div>
          <div className={styles.title}>{heading}</div>
        </div>

        <div className={styles.list}>
          {actionRows.map(row => (
            <PopoverRow
              key={`${row.label}-${row.preview}`}
              label={row.label}
              preview={row.preview}
              cost={row.cost ?? 0}
              costUnit={row.costUnit ?? costUnit}
              costLabel={row.costLabel}
              onClick={row.onClick}
              icon={row.icon}
              maxCost={maxCost}
              disabled={row.disabled}
            />
          ))}
        </div>
      </motion.div>
    </>
  )
}
