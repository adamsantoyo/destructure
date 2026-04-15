export default function moveFocusByArrow(event, { group, index, bindings }) {
  const delta = bindings[event.key]
  if (delta == null) return

  event.preventDefault()
  const next = document.querySelector(`[data-nav-group="${group}"][data-nav-index="${index + delta}"]`)
  next?.focus()
}
