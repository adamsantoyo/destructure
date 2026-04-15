import { motion } from 'framer-motion' // eslint-disable-line no-unused-vars
import styles from './Tooltip.module.css'

export default function Tooltip({ title, text }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className={styles.tooltip}
    >
      {title && <div className={styles.title}>{title}</div>}
      <div className={styles.text}>{text}</div>
      <div className={styles.arrow} />
    </motion.div>
  )
}
