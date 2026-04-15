import { motion } from 'framer-motion' // eslint-disable-line no-unused-vars
import CtrlButton from './CtrlButton'
import styles from './WelcomeOverlay.module.css'

function PreviewCells() {
  const cells = ['Ivy', 'Moth', 'Neon', 'Dust']

  return (
    <div className={styles.previewStage}>
      {cells.map((cell, index) => (
        <motion.div
          key={cell}
          className={styles.previewCell}
          animate={{
            x: index > 0 ? [-6, 0, 0] : [0, -2, 0],
            opacity: index === 0 ? [1, 0.35, 1] : 1,
          }}
          transition={{
            repeat: Infinity,
            repeatDelay: 1.2,
            duration: 1.4,
            delay: index * 0.05,
          }}
        >
          {cell.slice(0, 2)}
        </motion.div>
      ))}
    </div>
  )
}

export default function WelcomeOverlay({ onStart, exploredCount }) {
  return (
    <div className={styles.overlay}>
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24 }}
        className={styles.card}
      >
        <div className={styles.copy}>
          <div>
            <div className={styles.eyebrow}>Feel first, understand second</div>
            <h1 className={styles.title}>
              destruc<span>ture</span>
            </h1>
          </div>

          <div className={styles.pitch}>
            Learn why data structures feel fast or slow by poking them directly.
          </div>

          <div className={styles.secondary}>
            Click a cell, trigger an operation, and watch the hidden work happen. The goal is pattern recognition first, Big-O vocabulary second.
          </div>

          <div className={styles.actions}>
            <CtrlButton label="Start exploring" icon=">" glow onClick={onStart} />
            <div className={styles.secondary}>{exploredCount > 0 ? `${exploredCount} structures already explored on this device.` : 'Your first scene opens with Array so the cost difference is obvious immediately.'}</div>
          </div>
        </div>

        <div className={styles.preview}>
          <div>
            <div className={styles.previewTitle}>Preview the interaction</div>
            <div className={styles.previewText}>Delete one early array item and every item behind it has to move.</div>
          </div>

          <PreviewCells />

          <div className={styles.previewGuide}>
            <div className={styles.guideItem}>
              <strong>Interactive by default</strong>
              <span>Most scenes let you click the structure itself, not just the footer controls.</span>
            </div>
            <div className={styles.guideItem}>
              <strong>Progress sticks</strong>
              <span>Explored structures and unlocked insights persist locally so the sidebar starts to reflect what you have learned.</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
