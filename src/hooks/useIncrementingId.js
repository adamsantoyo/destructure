import { useCallback, useRef } from 'react'

export default function useIncrementingId(initialValue = 0) {
  const ref = useRef(initialValue)

  const next = useCallback(() => {
    const value = ref.current
    ref.current += 1
    return value
  }, [])

  const peek = useCallback(() => ref.current, [])

  const set = useCallback((value) => {
    ref.current = value
  }, [])

  const reset = useCallback((value = initialValue) => {
    ref.current = value
  }, [initialValue])

  return { next, peek, set, reset }
}
