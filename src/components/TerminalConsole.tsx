import React, { useState, useRef, useEffect } from 'react'
import type { Scenario } from '../utils/scenarios'
import { Terminal as TerminalIcon, Sparkles } from 'lucide-react'

interface TerminalConsoleProps {
  logs: string[]
  currentScenario: Scenario
  onCommand: (cmd: string) => void
  onNextScenario: () => void
}

export const TerminalConsole: React.FC<TerminalConsoleProps> = ({
  logs,
  currentScenario,
  onCommand,
  onNextScenario,
}) => {
  const [inputVal, setInputVal] = useState('')
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [logs])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputVal.trim()) return
    onCommand(inputVal.trim())
    setInputVal('')
  }

  const getLogClass = (line: string) => {
    if (line.includes('[FAILED]') || line.includes('[ERROR]') || line.includes('❌') || line.includes('FAIL')) {
      return 'log-error'
    }
    if (line.includes('[SUCCESS]') || line.includes('PASS') || line.includes('✅') || line.includes('🚀')) {
      return 'log-success'
    }
    if (line.startsWith('$') || line.includes('[CI]') || line.includes('[VITEST]') || line.includes('[VERCEL]')) {
      return 'log-command'
    }
    return 'log-info'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      {/* Active Challenge Card */}
      <div className="challenge-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="challenge-badge">DevOps Challenge • {currentScenario.badge}</span>
          <button
            onClick={onNextScenario}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#38bdf8',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Sparkles size={12} /> Next Challenge
          </button>
        </div>
        <div className="challenge-title">{currentScenario.title}</div>
        <div className="challenge-desc">{currentScenario.description}</div>
        <div
          style={{
            marginTop: '8px',
            fontSize: '11px',
            color: '#a855f7',
            background: 'rgba(168, 85, 247, 0.1)',
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid rgba(168, 85, 247, 0.2)',
          }}
        >
          <strong>Target:</strong> {currentScenario.objective}
        </div>
      </div>

      {/* Terminal Window */}
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-dots">
            <span className="terminal-dot dot-red" />
            <span className="terminal-dot dot-yellow" />
            <span className="terminal-dot dot-green" />
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TerminalIcon size={12} /> branchlab-cli • zsh
          </span>
          <span>v1.0.0</span>
        </div>

        <div className="terminal-body" ref={bodyRef}>
          <div className="log-info" style={{ marginBottom: '8px', opacity: 0.8 }}>
            BranchLab Terminal ready. Type <code>help</code>, <code>git commit -m "msg"</code>, or use UI buttons.
          </div>
          {logs.map((line, idx) => (
            <div key={`log-${idx}`} className={`log-line ${getLogClass(line)}`}>
              {line}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="terminal-input-bar">
          <span className="terminal-prompt">$</span>
          <input
            type="text"
            className="terminal-input"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="git commit -m 'feat: ...' or git checkout main"
          />
        </form>
      </div>
    </div>
  )
}
