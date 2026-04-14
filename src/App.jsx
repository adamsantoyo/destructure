import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import ArrayScene from './scenarios/01-array/ArrayScene'
import LinkedListScene from './scenarios/02-linked-list/LinkedListScene'
import StackScene from './scenarios/03-stack/StackScene'
import QueueScene from './scenarios/04-queue/QueueScene'
import HashTableScene from './scenarios/05-hash-table/HashTableScene'
import BSTScene from './scenarios/06-bst/BSTScene'
import CompareScene from './modes/compare/CompareScene'
import InfoPanel from './components/InfoPanel'

const SCENARIOS = [
  { id: '01', label: 'Array',        Scene: ArrayScene,       ready: true  },
  { id: '02', label: 'Linked List',  Scene: LinkedListScene,  ready: true  },
  { id: '03', label: 'Stack',        Scene: StackScene,       ready: true  },
  { id: '04', label: 'Queue',        Scene: QueueScene,       ready: true  },
  { id: '05', label: 'Hash Table',   Scene: HashTableScene,   ready: true  },
  { id: '06', label: 'BST',          Scene: BSTScene,         ready: true  },
]

const MODES = [
  { id: 'explore', label: 'Explore', ready: true },
  { id: 'compare', label: 'Compare', ready: true },
  { id: 'challenge', label: 'Challenge', ready: false },
  { id: 'break', label: 'Break It', ready: false },
]

function ComingSoon({ label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-dim)' }}>{label}</div>
      <div style={{ fontSize: 'var(--size-sm)', color: 'var(--text-dim)', opacity: 0.5 }}>coming soon</div>
    </div>
  )
}

export default function App() {
  const [activeMode, setActiveMode] = useState('explore')
  const [activeId, setActiveId] = useState('01')
  const [glossaryOpen, setGlossaryOpen] = useState(false)
  const [infoPanelOpen, setInfoPanelOpen] = useState(true)
  const active = SCENARIOS.find(s => s.id === activeId)

  return (
    <div className="app-container">

      {/* ── Sidebar ── */}
      <aside className="app-sidebar">
        <div className="sidebar-header sidebar-label">
          <div className="sidebar-title">
            destructure
          </div>
          <div className="sidebar-subtitle">
            unpack the decision.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, padding: '0 24px', marginBottom: 24, flexDirection: 'column' }}>
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => {
                if (m.ready) {
                  setActiveMode(m.id)
                  if (m.id !== 'explore') setInfoPanelOpen(false)
                }
              }}
              style={{
                textAlign: 'center',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: activeMode === m.id ? 'var(--accent)' : 'transparent',
                color: activeMode === m.id ? 'var(--bg)' : m.ready ? 'var(--text)' : 'var(--text-dim)',
                border: activeMode === m.id ? 'none' : '1px solid var(--border)',
                fontSize: '0.75rem',
                fontWeight: activeMode === m.id ? 700 : 400,
                opacity: m.ready ? 1 : 0.4,
                cursor: m.ready ? 'pointer' : 'default',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {activeMode === 'explore' && (
          <>
            <div className="sidebar-section-title sidebar-label">
              Scenarios
            </div>

            {SCENARIOS.map(s => {
              const isActive = s.id === activeId
              return (
                <div key={s.id}>
                  <button
                    onClick={() => s.ready && setActiveId(s.id)}
                    className={`scenario-btn ${isActive ? 'active' : s.ready ? 'inactive' : 'disabled'}`}
                  >
                    <span className="scenario-id">{s.id}</span>
                    <span className="sidebar-label">{s.label}</span>
                  </button>
                  {isActive && (
                    <button
                      onClick={() => setInfoPanelOpen(prev => !prev)}
                      className={`reference-toggle ${infoPanelOpen ? 'open' : 'closed'}`}
                    >
                      {infoPanelOpen ? '\u25BE' : '\u25B8'} reference
                    </button>
                  )}
                </div>
              )
            })}
          </>
        )}
        <div className="glossary-section">
          <button
            onClick={() => setGlossaryOpen(prev => !prev)}
            className="glossary-btn sidebar-label"
          >
            <span style={{ fontSize: '0.85rem' }}>{glossaryOpen ? '\u25BE' : '\u25B8'}</span>
            Big-O Guide
          </button>
          <AnimatePresence>
            {glossaryOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div className="glossary-content sidebar-label">
                  <div className="glossary-item">
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>O(1)</span>{' '}
                    <span className="glossary-item-desc">constant</span>
                    <br />Same speed no matter the size.
                  </div>
                  <div className="glossary-item">
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>O(log n)</span>{' '}
                    <span className="glossary-item-desc">logarithmic</span>
                    <br />Doubles in size, one extra step.
                  </div>
                  <div className="glossary-item">
                    <span style={{ color: 'var(--danger)', fontWeight: 700 }}>O(n)</span>{' '}
                    <span className="glossary-item-desc">linear</span>
                    <br />Twice the data, twice the work.
                  </div>
                  <div className="glossary-footnote">
                    Shown in status pills and history.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Keyboard hints ── */}
        <div className="keyboard-hints sidebar-label">
          <span style={{ fontWeight: 700 }}>R</span> reset &nbsp;&middot;&nbsp; <span style={{ fontWeight: 700 }}>Esc</span> close
        </div>
      </aside>

      {/* ── Main canvas ── */}
      <main className="app-main">
        {activeMode === 'explore' ? (
          active?.Scene ? <active.Scene /> : <ComingSoon label={active?.label} />
        ) : activeMode === 'compare' ? (
          <CompareScene />
        ) : (
          <ComingSoon label={MODES.find(m => m.id === activeMode)?.label} />
        )}
      </main>

      {/* ── Info panel ── */}
      {activeMode === 'explore' && (
        <InfoPanel structureId={activeId} open={infoPanelOpen} onClose={() => setInfoPanelOpen(false)} />
      )}

      {/* ── Mobile Warning ── */}
      <div className="mobile-warning">
        <div style={{ color: 'var(--accent)', fontSize: '2rem', marginBottom: 8 }}>d.</div>
        <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text)' }}>Screen too small</div>
        <p>Destructure's data structures require more horizontal space to accurately visualize operations.</p>
        <p>Please view on a desktop or tablet for the intended learning experience.</p>
      </div>

    </div>
  )
}
