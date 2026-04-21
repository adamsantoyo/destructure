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
            Click any element in the structure to see what operations are available and what they cost. Then execute and watch the hidden work happen.
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
              <strong>Click to interact</strong>
              <span>Click any element in the structure — a menu shows what you can do and what it will cost.</span>
            </div>
            <div className={styles.guideItem}>
              <strong>Progress sticks</strong>
              <span>Explored structures and unlocked insights persist locally so the sidebar reflects what you have learned.</span>
            </div>
            <div className={styles.guideItem}>
              <strong>Keyboard shortcuts</strong>
              <span>R to reset the scene, Esc to close menus.</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
