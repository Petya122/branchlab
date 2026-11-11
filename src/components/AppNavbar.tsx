import React from 'react'
import {
  Cpu,
  GitBranch,
  GitCommit,
  GitMerge,
  Globe,
  HelpCircle,
  Home,
  Layers,
  Settings as SettingsIcon,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import type { BranchingModel } from '../types/git'
import type { ModalId } from '../hooks/useModals'
import type { LevelInfo } from '../utils/trophies'
import { LabQuickActions } from './LabQuickActions'

export type AppView = 'home' | 'lab'

const MODELS: { id: BranchingModel; label: string; icon: LucideIcon }[] = [
  { id: 'gitflow', label: 'GitFlow', icon: GitBranch },
  { id: 'trunk-based', label: 'Trunk-Based', icon: GitCommit },
  { id: 'github-flow', label: 'GitHub Flow', icon: GitMerge },
]

const trophyTextStyle: React.CSSProperties = { fontSize: '11px', fontWeight: '700', color: '#f59e0b' }

interface AppNavbarProps {
  view: AppView
  onNavigate: (view: AppView) => void
  model: BranchingModel
  onModelChange: (model: BranchingModel) => void
  level: LevelInfo
  xp: number
  isPipelineRunning: boolean
  onOpenModal: (id: ModalId) => void
  onRunPipeline: () => void
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  view,
  onNavigate,
  model,
  onModelChange,
  level,
  xp,
  isPipelineRunning,
  onOpenModal,
  onRunPipeline,
}) => (
  <header className="navbar">
    <div className="brand-section">
      <div
        className="brand-logo"
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
        aria-label="Go to homepage"
        onClick={() => onNavigate('home')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onNavigate('home')
          }
        }}
        title="Go to Homepage"
      >
        <Layers size={22} />
      </div>
      <div className="brand-info">
        <h1>
          <span style={{ cursor: 'pointer' }} onClick={() => onNavigate('home')}>
            BranchLab
          </span>
          <a
            href="https://branchlab.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="domain-badge"
            title="Target Production Domain"
          >
            <Globe size={11} />
            branchlab.tech
          </a>
        </h1>
      </div>
    </div>

    {/* Home/Lab switch and, in the lab, the branching strategy switch */}
    <div className="nav-selectors-strip">
      <div className="model-selector">
        <button className={`model-button ${view === 'home' ? 'active' : ''}`} onClick={() => onNavigate('home')}>
          <Home size={13} />
          Home
        </button>
        <button className={`model-button ${view === 'lab' ? 'active' : ''}`} onClick={() => onNavigate('lab')}>
          <Cpu size={13} />
          Interactive Lab
        </button>
      </div>

      {view === 'lab' && (
        <div className="model-selector">
          {MODELS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`model-button ${model === id ? 'active' : ''}`}
              onClick={() => onModelChange(id)}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>

    <div className="navbar-controls">
      <button
        className="action-btn btn-ghost"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          background: 'rgba(245, 158, 11, 0.08)',
        }}
        onClick={() => onOpenModal('trophies')}
        title="Open DevOps Trophy Room"
      >
        <Trophy size={14} color="#f59e0b" />
        <span className="trophy-text-full" style={trophyTextStyle}>
          Lvl {level.level} • {xp} XP
        </span>
        <span className="trophy-text-short" style={trophyTextStyle}>
          Lvl {level.level}
        </span>
      </button>

      <button
        className="action-btn btn-ghost"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          background: 'rgba(56, 189, 248, 0.08)',
          color: '#38bdf8',
        }}
        onClick={() => onOpenModal('tutorial')}
        title="Open Guided Tutorial Tour"
      >
        <HelpCircle size={14} />
        <span style={{ fontSize: '11px', fontWeight: '700' }}>Tour</span>
      </button>

      <button
        className="action-btn btn-ghost"
        style={{ padding: '7px 10px' }}
        onClick={() => onOpenModal('settings')}
        title="Open Settings"
        aria-label="Open Settings"
      >
        <SettingsIcon size={15} color="var(--text-secondary)" />
      </button>
    </div>

    {view === 'lab' && (
      <LabQuickActions
        variant="desktop"
        isPipelineRunning={isPipelineRunning}
        onOpenModal={onOpenModal}
        onRunPipeline={onRunPipeline}
      />
    )}
  </header>
)
