import Grid from './Grid'
import styles from './SceneFrame.module.css'

export default function SceneFrame({
  sceneLabel,
  title,
  subtitle,
  stats,
  explainer,
  legend,
  toolbar,
  history,
  align = 'center',
  children,
}) {
  return (
    <div className={styles.scene}>
      <Grid />

      <div className={styles.header}>
        <div className={styles.headerCopy}>
          <div className={styles.sceneLabel}>{sceneLabel}</div>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>
        {stats && <div className={styles.stats}>{stats}</div>}
      </div>

      {explainer && <div className={styles.explainerWrap}>{explainer}</div>}
      {legend && <div className={styles.legendWrap}>{legend}</div>}

      <div className={styles.stage}>
        <div className={styles.canvasShell}>
          <div className={`${styles.canvasBody} ${align === 'top' ? styles.alignTop : styles.alignCenter}`}>
            {children}
          </div>
          {toolbar && (
            <div className={styles.toolbarWrap}>
              <div className={styles.toolbar}>{toolbar}</div>
            </div>
          )}
        </div>
      </div>

      {history && <div className={styles.historyWrap}>{history}</div>}
    </div>
  )
}
