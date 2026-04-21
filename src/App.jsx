import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import ArrayScene from './scenarios/01-array/ArrayScene'
import LinkedListScene from './scenarios/02-linked-list/LinkedListScene'
import StackScene from './scenarios/03-stack/StackScene'
import QueueScene from './scenarios/04-queue/QueueScene'
import HashTableScene from './scenarios/05-hash-table/HashTableScene'
import BSTScene from './scenarios/06-bst/BSTScene'
import CompareScene from './modes/compare/CompareScene'
import InfoPanel from './components/InfoPanel'
import WelcomeOverlay from './components/WelcomeOverlay'
import MilestoneToast from './components/MilestoneToast'
import ThemeToggle from './components/ThemeToggle'

const STORAGE_KEY = 'destructure-progress-v2'
const INFO_PANEL_KEY = 'destructure-info-panel-open'

const SCENARIOS = [
  { id: '01', label: 'Array', hint: 'Indexed row', icon: '[]', group: 'Linear', Scene: ArrayScene, ready: true },
  { id: '02', label: 'Linked List', hint: 'Pointer chain', icon: '->', group: 'Linear', Scene: LinkedListScene, ready: true },
  { id: '03', label: 'Stack', hint: 'Top only', icon: '^^', group: 'Linear', Scene: StackScene, ready: true },
  { id: '04', label: 'Queue', hint: 'FIFO lane', icon: '=>', group: 'Linear', Scene: QueueScene, ready: true },
  { id: '05', label: 'Hash Table', hint: 'Bucket map', icon: '#', group: 'Non-linear', Scene: HashTableScene, ready: true },
  { id: '06', label: 'BST', hint: 'Branching search', icon: 'Y', group: 'Non-linear', Scene: BSTScene, ready: true },
]

const MODES = [
  { id: 'explore', label: 'Explore', tag: 'Live', ready: true },
  { id: 'compare', label: 'Compare', tag: 'Guided', ready: true },
  { id: 'challenge', label: 'Challenge', tag: 'Soon', ready: false },
  { id: 'break', label: 'Break It', tag: 'Soon', ready: false },
]

const DEFAULT_PROGRESS = {
  introSeen: false,
  explored: {},
  insights: {},
  metrics: {},
  hints: {},
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PROGRESS
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PROGRESS
  }
}

function ComingSoon({ label }) {
  return (
    <div className="comingSoon">
      <div className="comingSoonCard">
        <div className="comingSoonMark">d.</div>
        <div className="comingSoonTitle">{label}</div>
        <div className="comingSoonText">This mode is planned, but the revamped interaction model is still being built.</div>
      </div>
    </div>
  )
}

function ScenarioButton({ scenario, active, explored, collapsed, onClick }) {
  return (
    <button
      type="button"
      onClick={() => scenario.ready && onClick(scenario.id)}
      className={[
        'scenarioButton',
        active ? 'scenarioButtonActive' : '',
        !scenario.ready ? 'scenarioButtonDisabled' : '',
      ].filter(Boolean).join(' ')}
    >
      <span className="scenarioIcon">{scenario.icon}</span>
      <span className="scenarioText">
        <span className="scenarioName">{scenario.label}</span>
        {!collapsed && <span className="scenarioHint">{scenario.hint}</span>}
      </span>
      {!collapsed && (
        <span className="scenarioStatus">
          <span className={[
            'scenarioDot',
            explored ? 'scenarioDotExplored' : '',
            active ? 'scenarioDotActive' : '',
          ].filter(Boolean).join(' ')} />
          {active ? 'active' : explored ? 'explored' : 'new'}
        </span>
      )}
    </button>
  )
}

export default function App() {
  const [activeMode, setActiveMode] = useState('explore')
  const [activeId, setActiveId] = useState('01')
  const [glossaryOpen, setGlossaryOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [progress, setProgress] = useState(loadProgress)
  const [infoPanelOpen, setInfoPanelOpen] = useState(() => {
    try {
      const raw = localStorage.getItem(INFO_PANEL_KEY)
      if (raw !== null) return JSON.parse(raw)
    } catch {
      // ignore localStorage failures
    }
    return !loadProgress().introSeen
  })
  const [toastQueue, setToastQueue] = useState([])
  const [toastPaused, setToastPaused] = useState(false)

  const active = SCENARIOS.find(s => s.id === activeId)
  const exploredCount = Object.keys(progress.explored || {}).length
  const groupedScenarios = useMemo(() => {
    return SCENARIOS.reduce((groups, scenario) => {
      groups[scenario.group] ??= []
      groups[scenario.group].push(scenario)
      return groups
    }, {})
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }, [progress])

  useEffect(() => {
    localStorage.setItem(INFO_PANEL_KEY, JSON.stringify(infoPanelOpen))
  }, [infoPanelOpen])

  useEffect(() => {
    if (activeMode !== 'explore') return
    setProgress(prev => {
      if (prev.explored[activeId]) return prev
      return {
        ...prev,
        explored: {
          ...prev.explored,
          [activeId]: true,
        },
      }
    })
  }, [activeId, activeMode])

  useEffect(() => {
    if (activeMode !== 'compare') return
    setProgress(prev => {
      if (prev.insights.compare_mode) return prev
      return {
        ...prev,
        insights: {
          ...prev.insights,
          compare_mode: true,
        },
      }
    })
    setToastQueue(prev => {
      if (prev.some(item => item.id === 'compare_mode')) return prev
      return [...prev, {
        id: 'compare_mode',
        title: 'Compare mode unlocked',
        body: 'Step the same operation side by side so the difference feels obvious instead of theoretical.',
      }]
    })
  }, [activeMode])

  const unlockInsight = useCallback((id, title, body) => {
    setProgress(prev => {
      if (prev.insights[id]) return prev
      return {
        ...prev,
        insights: {
          ...prev.insights,
          [id]: true,
        },
      }
    })
    setToastQueue(prev => {
      if (prev.some(item => item.id === id)) return prev
      return [...prev, { id, title, body }]
    })
  }, [])

  const handleSceneEvent = useCallback((event) => {
    if (event?.type !== 'operation') return

    setProgress(prev => {
      const current = prev.metrics[event.structure] || { operations: 0, positions: {} }
      const nextMetrics = {
        ...prev.metrics,
        [event.structure]: {
          operations: current.operations + 1,
          positions: {
            ...current.positions,
            ...(event.position ? { [event.position]: true } : {}),
          },
        },
      }

      return {
        ...prev,
        metrics: nextMetrics,
      }
    })

    unlockInsight('first_operation', 'First operation logged', 'You are not just reading definitions now. Watch the cost pill and history drawer while you keep clicking.')

    if (event.cost === 0 || event.complexity === 'O(1)') {
      unlockInsight('first_constant', 'You found an O(1) move', 'Not every interaction scales with size. This one stays flat as the structure grows.')
    }

    if ((event.structure === 'array' || event.structure === 'linked-list') && event.position) {
      const positions = progress.metrics[event.structure]?.positions || {}
      const sawFront = positions.front || event.position === 'front'
      const sawEnd = positions.end || event.position === 'end'
      if (sawFront && sawEnd) {
        unlockInsight('front_vs_end', 'Front vs end clicked', 'Now the contrast is visible: identical verbs can produce very different work depending on position.')
      }
    }
  }, [progress.metrics, unlockInsight])

  const handleSelectScenario = useCallback((id) => {
    setActiveId(id)
    setActiveMode('explore')
    setSidebarOpen(false)
  }, [])

  const handleStart = useCallback(() => {
    setProgress(prev => ({ ...prev, introSeen: true }))
  }, [])

  const dismissFirstCellHint = useCallback(() => {
    setProgress(prev => {
      if (prev.hints.array_first_cell) return prev
      return {
        ...prev,
        hints: {
          ...prev.hints,
          array_first_cell: true,
        },
      }
    })
  }, [])

  const currentToast = toastQueue[0] ?? null

  useEffect(() => {
    if (!currentToast || toastPaused) return undefined
    const timer = setTimeout(() => {
      setToastQueue(prev => prev.slice(1))
    }, 4200)
    return () => clearTimeout(timer)
  }, [currentToast, toastPaused])

  const sceneProps = {
    onSceneEvent: handleSceneEvent,
    showFirstCellHint: progress.introSeen && activeId === '01' && !progress.hints.array_first_cell,
    dismissFirstCellHint,
  }

  const renderScene = () => {
    if (activeMode === 'explore') {
      return active?.Scene ? <active.Scene {...sceneProps} /> : <ComingSoon label={active?.label} />
    }
    if (activeMode === 'compare') return <CompareScene />
    return <ComingSoon label={MODES.find(mode => mode.id === activeMode)?.label} />
  }

  return (
    <div className={`appShell ${sidebarCollapsed ? 'sidebarCollapsed' : ''}`}>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <div className={`sidebarBackdrop ${sidebarOpen ? 'sidebarBackdropOpen' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={[
        'appSidebar',
        sidebarCollapsed ? 'appSidebarCollapsed' : '',
        sidebarOpen ? 'appSidebarMobileOpen' : '',
      ].filter(Boolean).join(' ')}>
        <div className="sidebarTop">
          <div className="brandBlock">
            <div className="brandMark">
              <span className="brandPulse" />
              d.
            </div>
            <div className="brandText sidebarOnlyLabel">
              <div className="brandTitle">destructure</div>
              <div className="brandSubtitle">unpack the decision, then name the cost.</div>
            </div>
          </div>

          <button type="button" className="collapseButton" onClick={() => setSidebarCollapsed(prev => !prev)} aria-label="Collapse sidebar">
            {sidebarCollapsed ? '»' : '«'}
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="sidebarMeta">
            <div className="sidebarMetaLabel">Progress</div>
            <div className="sidebarMetaValue">
              <strong>{exploredCount}</strong>
              <span>of {SCENARIOS.length} explored</span>
            </div>
          </div>
        )}

        <div className="sidebarNav">
          {Object.entries(groupedScenarios).map(([group, scenarios]) => (
            <div className="sidebarSection" key={group}>
              {!sidebarCollapsed && (
                <div className="sidebarSectionHeader">
                  <div className="sidebarSectionTitle">{group}</div>
                </div>
              )}
              <div className="scenarioList">
                {scenarios.map(scenario => (
                  <ScenarioButton
                    key={scenario.id}
                    scenario={scenario}
                    active={activeMode === 'explore' && scenario.id === activeId}
                    explored={Boolean(progress.explored[scenario.id])}
                    collapsed={sidebarCollapsed}
                    onClick={handleSelectScenario}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {!sidebarCollapsed && (
          <div className="glossarySection">
            <button type="button" onClick={() => setGlossaryOpen(prev => !prev)} className="glossaryButton">
              <span>Big-O guide</span>
              <span>{glossaryOpen ? 'close' : 'open'}</span>
            </button>

            <AnimatePresence initial={false}>
              {glossaryOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="glossaryContent"
                >
                  <div className="glossaryCard">
                    <div><span className="glossaryTerm">O(1)</span> stays flat no matter how much data you add.</div>
                    <div><span className="glossaryTerm">O(log n)</span> grows slowly because each decision cuts the search space down.</div>
                    <div><span className="glossaryTerm">O(n)</span> scales with the size of the structure, so every extra item can add work.</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="keyboardHints">
              <span>R reset</span>
              <span>Esc close</span>
            </div>
          </div>
        )}
      </aside>

      <div className="appWorkspace">
        <header className="topbar">
          <div className="topbarPrimary">
            <button type="button" className="menuButton mobileOnly" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
              ☰
            </button>

            <div className="topbarCopy">
              <div className="topbarLabel">{activeMode === 'explore' ? 'Interactive lesson' : 'Mode'}</div>
              <div className="topbarHeading">{activeMode === 'explore' ? `${active?.label} scene` : MODES.find(mode => mode.id === activeMode)?.label}</div>
              <div className="topbarSubheading">
                {activeMode === 'explore'
                  ? 'Click into the structure, not just the footer buttons.'
                  : 'Use the segmented control to switch between exploration and guided comparison.'}
              </div>
            </div>
          </div>

          <div className="topbarActions">
            <ThemeToggle />

            <div className="stageBadge">
              <span className="progressPill">{exploredCount}/{SCENARIOS.length} explored</span>
            </div>

            <div className="modeTabs" role="tablist" aria-label="Modes">
              {MODES.map(mode => (
                <button
                  key={mode.id}
                  type="button"
                  id={`mode-tab-${mode.id}`}
                  onClick={() => {
                    if (!mode.ready) return
                    setActiveMode(mode.id)
                    setSidebarOpen(false)
                  }}
                  className={[
                    'modeTab',
                    activeMode === mode.id ? 'modeTabActive' : '',
                    !mode.ready ? 'modeTabDisabled' : '',
                  ].filter(Boolean).join(' ')}
                  disabled={!mode.ready}
                  role="tab"
                  aria-selected={activeMode === mode.id}
                  aria-controls="mode-panel"
                  tabIndex={activeMode === mode.id ? 0 : -1}
                >
                  <span className="modeTabLabel">{mode.label}</span>
                  <span className="modeTabTag">{mode.tag}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="stage" id="mode-panel" role="tabpanel" aria-labelledby={`mode-tab-${activeMode}`}>
          <div className="sceneViewport" id="main-content" tabIndex={-1}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeMode}-${activeId}`}
                initial={{ opacity: 0, y: 10, scale: 0.988, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, scale: 1.01, filter: 'blur(10px)' }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className="sceneTransition"
              >
                {renderScene()}
              </motion.div>
            </AnimatePresence>
          </div>

          {activeMode === 'explore' && (
            <>
              <InfoPanel structureId={activeId} open={infoPanelOpen} onClose={() => setInfoPanelOpen(false)} />
              {!infoPanelOpen && (
                <button
                  type="button"
                  className="referenceTab"
                  onClick={() => setInfoPanelOpen(true)}
                >
                  <span className="drawerHint">?</span>
                  <span className="referenceTabLabel">Open reference</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {!progress.introSeen && <WelcomeOverlay onStart={handleStart} exploredCount={exploredCount} />}
      <MilestoneToast
        toast={currentToast ? {
          ...currentToast,
          onPause: () => setToastPaused(true),
          onResume: () => setToastPaused(false),
        } : null}
        onClose={() => {
          setToastPaused(false)
          setToastQueue(prev => prev.slice(1))
        }}
      />
    </div>
  )
}
