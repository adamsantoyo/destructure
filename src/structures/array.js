/**
 * Array structure — pure logic.
 * Returns an array of steps. Zero rendering, zero React.
 *
 * Step shape: { type, ...payload, ops, explanation }
 * Types: 'highlight' | 'shift' | 'remove' | 'insert' | 'done' | 'info'
 *
 * Each shift is its own step so the scene can animate them one-by-one
 * and the counter climbs visibly. In this module, `ops` means extra shifts,
 * not generic action count.
 */

/* ── Pure cost calculators (no steps, no animation) ── */

export function getDeleteCost(length, index) {
  if (index < 0 || index >= length) return 0
  return length - index - 1
}

export function getInsertCost(length, index) {
  if (index < 0 || index > length) return 0
  return length - index
}

export function deleteFirst(arr) {
  if (!arr.length) return [{ type: 'info', explanation: 'The array is already empty.', ops: 0 }]

  const removed = arr[0]
  const remaining = arr.slice(1)
  const totalShifts = remaining.length

  const steps = [
    {
      type: 'highlight',
      index: 0,
      variant: 'danger',
      explanation: `"${removed}" is at position 0. Time to delete it.`,
      ops: 0,
    },
    {
      type: 'remove',
      index: 0,
      explanation: totalShifts === 0
        ? `"${removed}" is gone. Nothing else to move.`
        : `"${removed}" is gone — now every element behind it has to slide left to fill the gap.`,
      ops: 0,
    },
  ]

  // One step per shift — this is where you feel it
  for (let i = 0; i < totalShifts; i++) {
    const from = i + 1
    const to = i
    steps.push({
      type: 'shift',
      value: arr[from],
      fromIndex: from,
      toIndex: to,
      label: `copy arr[${from}] → arr[${to}]`,
      explanation: `"${arr[from]}" slides from position ${from} to ${to}.`,
      ops: i + 1,
    })
  }

  steps.push({
    type: 'done',
    ops: totalShifts,
    explanation: totalShifts === 0
      ? 'Done. That was the only element. O(1).'
      : `Done. Deleting from the front cost ${totalShifts} shift${totalShifts !== 1 ? 's' : ''} — one per element that had to move. This is O(n): the bigger the array, the more it costs.`,
  })

  return steps
}

export function deleteLast(arr) {
  if (!arr.length) return [{ type: 'info', explanation: 'The array is already empty.', ops: 0 }]

  const removed = arr[arr.length - 1]

  return [
    {
      type: 'highlight',
      index: arr.length - 1,
      variant: 'danger',
      explanation: `"${removed}" is at the end — position ${arr.length - 1}.`,
      ops: 0,
    },
    {
      type: 'remove',
      index: arr.length - 1,
      explanation: 'Gone. Nothing behind it needed to move.',
      ops: 0,
    },
    {
      type: 'done',
      ops: 0,
      explanation: 'Done. Deleting from the end adds no extra shifts. This is O(1): instant, no matter how big the array.',
    },
  ]
}

export function deleteAtIndex(arr, index) {
  if (index < 0 || index >= arr.length) {
    return [{ type: 'info', explanation: `Index ${index} is out of range (0–${arr.length - 1}).`, ops: 0 }]
  }
  if (index === 0) return deleteFirst(arr)
  if (index === arr.length - 1) return deleteLast(arr)

  const removed = arr[index]
  const totalShifts = arr.length - 1 - index

  const steps = [
    {
      type: 'highlight',
      index,
      variant: 'danger',
      explanation: `"${removed}" is at position ${index}.`,
      ops: 0,
    },
    {
      type: 'remove',
      index,
      explanation: `"${removed}" is gone — ${totalShifts} element${totalShifts !== 1 ? 's' : ''} behind it must shift left.`,
      ops: 0,
    },
  ]

  for (let i = 0; i < totalShifts; i++) {
    const from = index + 1 + i
    const to = index + i
    steps.push({
      type: 'shift',
      value: arr[from],
      fromIndex: from,
      toIndex: to,
      label: `copy arr[${from}] → arr[${to}]`,
      explanation: `"${arr[from]}" slides from position ${from} to ${to}.`,
      ops: i + 1,
    })
  }

  steps.push({
    type: 'done',
    ops: totalShifts,
    explanation: `Done. ${totalShifts} shift${totalShifts !== 1 ? 's' : ''}. The closer to the front you delete, the more it costs. O(n) worst case.`,
  })

  return steps
}

export function insertFirst(arr, value) {
  const totalShifts = arr.length

  const steps = [
    {
      type: 'info',
      explanation: totalShifts === 0
        ? `Inserting "${value}" into an empty array. No shifts needed.`
        : `Inserting "${value}" at the front. Every existing element has to shift right first.`,
      ops: 0,
    },
  ]

  // Shifts happen right-to-left (last element moves first to make room)
  for (let i = totalShifts - 1; i >= 0; i--) {
    steps.push({
      type: 'shift',
      value: arr[i],
      fromIndex: i,
      toIndex: i + 1,
      label: `copy arr[${i}] → arr[${i + 1}]`,
      explanation: `"${arr[i]}" shifts from position ${i} to ${i + 1}.`,
      ops: totalShifts - i,
    })
  }

  steps.push({
    type: 'insert',
    value,
    index: 0,
    explanation: `"${value}" is in at position 0. ${totalShifts} shift${totalShifts !== 1 ? 's' : ''} just to make room.`,
    ops: totalShifts,
  })

  steps.push({
    type: 'done',
    ops: totalShifts,
    explanation: totalShifts === 0
      ? 'Done. Empty array — no shifts. O(1).'
      : `Done. Inserting at the front cost ${totalShifts} shift${totalShifts !== 1 ? 's' : ''}. Same problem as deleting from the front — everything has to move. O(n).`,
  })

  return steps
}

export function insertLast(arr, value) {
  return [
    {
      type: 'insert',
      value,
      index: arr.length,
      explanation: `"${value}" goes straight into position ${arr.length}. Nothing else moves.`,
      ops: 0,
    },
    {
      type: 'done',
      ops: 0,
      explanation: 'Done. Inserting at the end adds no extra shifts. O(1).',
    },
  ]
}

export function insertAtIndex(arr, index, value) {
  if (index < 0 || index > arr.length) {
    return [{ type: 'info', explanation: `Index ${index} is out of range (0–${arr.length}).`, ops: 0 }]
  }
  if (index === 0) return insertFirst(arr, value)
  if (index === arr.length) return insertLast(arr, value)

  const totalShifts = arr.length - index

  const steps = [
    {
      type: 'info',
      explanation: `Inserting "${value}" at position ${index}. ${totalShifts} element${totalShifts !== 1 ? 's' : ''} behind it must shift right.`,
      ops: 0,
    },
  ]

  for (let i = arr.length - 1; i >= index; i--) {
    steps.push({
      type: 'shift',
      value: arr[i],
      fromIndex: i,
      toIndex: i + 1,
      label: `copy arr[${i}] → arr[${i + 1}]`,
      explanation: `"${arr[i]}" shifts from position ${i} to ${i + 1}.`,
      ops: arr.length - i,
    })
  }

  steps.push({
    type: 'insert',
    value,
    index,
    explanation: `"${value}" is in at position ${index}. ${totalShifts} shift${totalShifts !== 1 ? 's' : ''} to make room.`,
    ops: totalShifts,
  })

  steps.push({
    type: 'done',
    ops: totalShifts,
    explanation: `Done. ${totalShifts} shift${totalShifts !== 1 ? 's' : ''}. The closer to the front, the more it costs. O(n) worst case.`,
  })

  return steps
}
