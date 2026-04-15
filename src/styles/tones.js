/**
 * Tone palettes for the Explainer component.
 * Each tone maps to colors for border, text, background, and glow.
 */

export function getTone(tone = 'accent') {
  switch (tone) {
    case 'danger':
      return {
        text:       'var(--danger)',
        border:     'rgba(255, 51, 102, 0.25)',
        background: 'rgba(255, 51, 102, 0.05)',
        glow:       'rgba(255, 51, 102, 0.08)',
      }
    case 'success':
      return {
        text:       'var(--success)',
        border:     'rgba(102, 255, 153, 0.25)',
        background: 'rgba(102, 255, 153, 0.05)',
        glow:       'rgba(102, 255, 153, 0.08)',
      }
    case 'neutral':
      return {
        text:       'var(--text-secondary)',
        border:     'rgba(255, 255, 255, 0.08)',
        background: 'rgba(255, 255, 255, 0.02)',
        glow:       'transparent',
      }
    case 'muted':
      return {
        text:       'var(--text-secondary)',
        border:     'var(--border)',
        background: 'rgba(255, 255, 255, 0.02)',
        glow:       'transparent',
      }
    case 'accent':
    default:
      return {
        text:       'var(--accent)',
        border:     'rgba(0, 255, 200, 0.25)',
        background: 'rgba(0, 255, 200, 0.05)',
        glow:       'rgba(0, 255, 200, 0.08)',
      }
  }
}
