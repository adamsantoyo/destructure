import { useState } from 'react'
import ArrayScene from './scenarios/01-array/ArrayScene'
import LinkedListScene from './scenarios/02-linked-list/LinkedListScene'
import StackScene from './scenarios/03-stack/StackScene'
import QueueScene from './scenarios/04-queue/QueueScene'

const SCENARIOS = [
  { id: '01', label: 'Array',        Scene: ArrayScene,       ready: true  },
  { id: '02', label: 'Linked List',  Scene: LinkedListScene,  ready: true  },
  { id: '03', label: 'Stack',        Scene: StackScene,       ready: true  },
  { id: '04', label: 'Queue',        Scene: QueueScene,       ready: true  },
  { id: '05', label: 'Hash Table',   Scene: null,             ready: false },
  { id: '06', label: 'BST',          Scene: null,             ready: false },
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
  const [activeId, setActiveId] = useState('01')
  const active = SCENARIOS.find(s => s.id === activeId)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside className="app-sidebar" style={{
        width: 'var(--sidebar-w)',
        minWidth: 'var(--sidebar-w)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 0',
        gap: 4,
        transition: 'width 0.3s, min-width 0.3s',
        overflow: 'hidden',
      }}>
        <div className="sidebar-label" style={{ padding: '0 24px 28px', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
            destructure
          </div>
          <div style={{ fontSize: 'var(--size-xs)', color: 'var(--text-dim)', marginTop: 2 }}>
            unpack the decision.
          </div>
        </div>

        <div className="sidebar-label" style={{ padding: '0 12px', fontSize: 'var(--size-xs)', color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 24 }}>
          Scenarios
        </div>

        {SCENARIOS.map(s => {
          const isActive = s.id === activeId
          return (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 24px',
                background: isActive ? 'rgba(0,255,200,0.06)' : 'transparent',
                border: 'none',
                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                color: isActive ? 'var(--accent)' : s.ready ? 'var(--text)' : 'var(--text-dim)',
                fontSize: 'var(--size-sm)',
                fontWeight: isActive ? 700 : 300,
                cursor: s.ready ? 'pointer' : 'default',
                textAlign: 'left',
                transition: 'all 0.15s',
                opacity: s.ready ? 1 : 0.4,
              }}
            >
              <span style={{ color: 'var(--text-dim)', fontSize: 'var(--size-xs)', minWidth: 20 }}>{s.id}</span>
              <span className="sidebar-label">{s.label}</span>
            </button>
          )
        })}
      </aside>

      {/* ── Main canvas ── */}
      <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {active?.Scene ? <active.Scene /> : <ComingSoon label={active?.label} />}
      </main>

    </div>
  )
}
