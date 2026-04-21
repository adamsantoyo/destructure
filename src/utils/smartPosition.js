/**
 * Smart positioning utility that adjusts element position to keep it within viewport
 * @param {Object} params - Positioning parameters
 * @param {number} params.x - Initial x position
 * @param {number} params.y - Initial y position
 * @param {HTMLElement} params.element - The element to position (optional, for size calculation)
 * @param {number} params.width - Width of the element (if element not provided)
 * @param {number} params.height - Height of the element (if element not provided)
 * @param {number} params.offset - Offset from the anchor point (default: 8)
 * @param {string} params.preferredPosition - 'top' | 'bottom' | 'left' | 'right' (default: 'bottom')
 * @returns {Object} - { x, y, placement } adjusted position and final placement
 */
export function getSmartPosition({
  x,
  y,
  element,
  width,
  height,
  offset = 8,
  preferredPosition = 'bottom',
}) {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  }

  // Get element dimensions
  const elementWidth = width ?? (element ? element.offsetWidth : 300)
  const elementHeight = height ?? (element ? element.offsetHeight : 200)

  // Safety margins from viewport edges
  const margin = 16

  let finalX = x
  let finalY = y
  let placement = preferredPosition

  // Calculate positions for each placement option
  const positions = {
    bottom: {
      x: x - elementWidth / 2,
      y: y + offset,
    },
    top: {
      x: x - elementWidth / 2,
      y: y - elementHeight - offset,
    },
    right: {
      x: x + offset,
      y: y - elementHeight / 2,
    },
    left: {
      x: x - elementWidth - offset,
      y: y - elementHeight / 2,
    },
  }

  // Check if preferred position fits in viewport
  const checkFits = (pos) => {
    return (
      pos.x >= margin &&
      pos.x + elementWidth <= viewport.width - margin &&
      pos.y >= margin &&
      pos.y + elementHeight <= viewport.height - margin
    )
  }

  // Try preferred position first
  if (checkFits(positions[preferredPosition])) {
    finalX = positions[preferredPosition].x
    finalY = positions[preferredPosition].y
  } else {
    // Try other positions in order of preference
    const fallbackOrder = {
      bottom: ['top', 'right', 'left'],
      top: ['bottom', 'right', 'left'],
      left: ['right', 'bottom', 'top'],
      right: ['left', 'bottom', 'top'],
    }

    let found = false
    for (const fallback of fallbackOrder[preferredPosition]) {
      if (checkFits(positions[fallback])) {
        finalX = positions[fallback].x
        finalY = positions[fallback].y
        placement = fallback
        found = true
        break
      }
    }

    // If no position fits perfectly, center it and adjust to viewport
    if (!found) {
      finalX = Math.max(margin, Math.min(x - elementWidth / 2, viewport.width - elementWidth - margin))
      finalY = Math.max(margin, Math.min(y + offset, viewport.height - elementHeight - margin))
      placement = 'adjusted'
    }
  }

  return {
    x: finalX,
    y: finalY,
    placement,
  }
}

/**
 * React hook for smart positioning
 * @param {Object} anchorPosition - { x, y } position of the anchor
 * @param {Object} options - Positioning options
 * @returns {Object} - { position, placement } adjusted position and placement
 */
export function useSmartPosition(anchorPosition, options = {}) {
  if (!anchorPosition) return { position: null, placement: null }

  const { x, y, placement } = getSmartPosition({
    ...anchorPosition,
    ...options,
  })

  return {
    position: { x, y },
    placement,
  }
}
