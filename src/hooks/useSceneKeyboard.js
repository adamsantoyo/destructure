import { useEffect } from 'react'

function isEditableTarget(target) {
  if (!target) return false
  if (target.isContentEditable) return true
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

export default function useSceneKeyboard({ onClose, onReset, enabled = true }) {
  useEffect(() => {
    if (!enabled) return undefined

    function handleKeydown(event) {
      if (isEditableTarget(event.target)) return

      if (event.key === 'Escape') {
        onClose?.()
        return
      }

      if (!event.metaKey && !event.ctrlKey && !event.altKey && (event.key === 'r' || event.key === 'R')) {
        onReset?.()
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [enabled, onClose, onReset])
}
