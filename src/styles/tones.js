/**
 * Shared tone palettes used by SectionCard, StatusPill, Explainer, etc.
 * Single source of truth — no more duplicating color values per component.
 */

export const TONES = {
  accent: {
    border: 'rgba(0,255,200,0.35)',
    background: 'linear-gradient(180deg, rgba(0,255,200,0.08), rgba(0,255,200,0.02))',
    glow: 'rgba(0,255,200,0.12)',
    text: 'var(--accent)',
    pill: 'rgba(0,255,200,0.08)',
  },
  danger: {
    border: 'rgba(255,51,102,0.35)',
    background: 'linear-gradient(180deg, rgba(255,51,102,0.08), rgba(255,51,102,0.02))',
    glow: 'rgba(255,51,102,0.12)',
    text: 'var(--danger)',
    pill: 'rgba(255,51,102,0.08)',
  },
  neutral: {
    border: 'rgba(74,74,106,0.45)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
    glow: 'rgba(0,0,0,0)',
    text: 'var(--text-dim)',
    pill: 'rgba(255,255,255,0.03)',
  },
}

export function getTone(name) {
  return TONES[name] ?? TONES.neutral
}
