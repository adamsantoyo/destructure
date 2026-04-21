import { AnimatePresence, motion } from 'framer-motion' // eslint-disable-line no-unused-vars
import CloseIcon from './CloseIcon'
import styles from './MilestoneToast.module.css'

export default function MilestoneToast({ toast, onClose }) {
  return (
    <div className={styles.toastWrap} role="status" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className={styles.toast}
            onMouseEnter={toast.onPause}
            onMouseLeave={toast.onResume}
            role="alert"
          >
            <div className={styles.icon} aria-hidden="true">!</div>
            <div>
              <div className={styles.title}>{toast.title}</div>
              <div className={styles.body}>{toast.body}</div>
            </div>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Dismiss insight">
              <CloseIcon />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
