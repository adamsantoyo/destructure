import { useState, useRef, useCallback } from 'react'

/**
 * Manages a queue of animation steps.
 *
 * Returns:
 *   - currentStep: the step currently being shown
 *   - stepIndex: which step we're on
 *   - totalSteps: total number of steps
 *   - isPlaying: auto-play running
 *   - isDone: finished
 *   - run(steps, speed): start the queue
 *   - next(): advance one step (step mode)
 *   - reset(): clear everything
 */
export function useAnimationQueue() {
  const [steps, setSteps] = useState([])
  const [stepIndex, setStepIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const timerRef = useRef(null)
  const stepsRef = useRef([])
  const indexRef = useRef(-1)
  const speedRef = useRef(600)

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  const run = useCallback((newSteps, speed = 600, stepMode = false) => {
    clearTimer()
    stepsRef.current = newSteps
    speedRef.current = speed
    indexRef.current = -1
    setSteps(newSteps)
    setStepIndex(-1)
    setIsPlaying(!stepMode)

    if (!stepMode) {
      const advance = () => {
        const n = indexRef.current + 1
        if (n >= stepsRef.current.length) {
          setIsPlaying(false)
          return
        }
        indexRef.current = n
        setStepIndex(n)
        if (n < stepsRef.current.length - 1) {
          timerRef.current = setTimeout(advance, speedRef.current)
        } else {
          setIsPlaying(false)
        }
      }
      timerRef.current = setTimeout(advance, 400)
    }
  }, [])

  const next = useCallback(() => {
    const n = indexRef.current + 1
    if (n < stepsRef.current.length) {
      indexRef.current = n
      setStepIndex(n)
    }
  }, [])

  const reset = useCallback(() => {
    clearTimer()
    stepsRef.current = []
    indexRef.current = -1
    setSteps([])
    setStepIndex(-1)
    setIsPlaying(false)
  }, [])

  const currentStep = stepIndex >= 0 ? steps[stepIndex] : null
  const isDone = stepIndex >= 0 && steps.length > 0 && stepIndex === steps.length - 1

  return { currentStep, stepIndex, totalSteps: steps.length, isPlaying, isDone, run, next, reset }
}
