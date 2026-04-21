import styles from './LoadingSpinner.module.css'

/**
 * Loading spinner component with different sizes
 * @param {string} size - 'small' | 'medium' | 'large' (default: 'medium')
 * @param {string} color - Color of the spinner (default: 'currentColor')
 * @param {string} label - Accessible label for the spinner
 */
export default function LoadingSpinner({ size = 'medium', color = 'currentColor', label = 'Loading' }) {
  const sizeClass = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
  }[size] || styles.medium

  return (
    <div className={`${styles.spinner} ${sizeClass}`} role="status" aria-label={label}>
      <svg
        className={styles.svg}
        viewBox="0 0 50 50"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color }}
      >
        <circle
          className={styles.circle}
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
        />
      </svg>
      <span className="visually-hidden">{label}</span>
    </div>
  )
}
