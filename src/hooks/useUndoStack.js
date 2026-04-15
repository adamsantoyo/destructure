import { useCallback, useRef, useState } from 'react'

export default function useUndoStack() {
  const stackRef = useRef([])
  const [size, setSize] = useState(0)

  const capture = useCallback((snapshot) => {
    stackRef.current.push(structuredClone(snapshot))
    setSize(stackRef.current.length)
  }, [])

  const pop = useCallback(() => {
    const snapshot = stackRef.current.pop() ?? null
    setSize(stackRef.current.length)
    return snapshot
  }, [])

  const clear = useCallback(() => {
    stackRef.current = []
    setSize(0)
  }, [])

  return {
    capture,
    pop,
    clear,
    canUndo: size > 0,
    size,
  }
}
