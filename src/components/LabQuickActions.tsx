import React from 'react'
import { AlertTriangle, GitBranch, GitCommit, GitMerge, GitPullRequest, Play, type LucideIcon } from 'lucide-react'
import type { ModalId } from '../hooks/useModals'

interface QuickAction {
  modal: ModalId
  label: string
  icon: LucideIcon
  color: string
  /** Desktop-only extras */
  border?: string
  title?: string
}

const QUICK_ACTIONS: QuickAction[] = [
  { modal: 'commit', label: 'Commit', icon: GitCommit, color: '#38bdf8' },
  { modal: 'branch', label: 'Branch', icon: GitBranch, color: '#a855f7' },
  { modal: 'merge', label: 'Merge', icon: GitMerge, color: '#10b981' },
  {
    modal: 'pr',
    label: 'PR',
    icon: GitPullRequest,
    color: '#c084fc',
    border: '1px solid rgba(168, 85, 247, 0.3)',
    title: 'Simulate GitHub Pull Request & Branch Protection',
  },
  {
    modal: 'conflict',
    label: 'Conflict',
    icon: AlertTriangle,
    color: '#f59e0b',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    title: 'Simulate Interactive Git Merge Conflict',
  },
]

interface LabQuickActionsProps {
  variant: 'desktop' | 'mobile'
  isPipelineRunning: boolean
  onOpenModal: (id: ModalId) => void
  onRunPipeline: () => void
}

/** Lab action buttons: a toolbar in the desktop navbar, a bottom dock on phones. */
export const LabQuickActions: React.FC<LabQuickActionsProps> = ({
  variant,
  isPipelineRunning,
  onOpenModal,
  onRunPipeline,
}) => {
  if (variant === 'mobile') {
    return (
      <aside className="mobile-action-bar">
        {QUICK_ACTIONS.map(({ modal, label, icon: Icon, color }) => (
          <button key={modal} className="mobile-action-btn" onClick={() => onOpenModal(modal)}>
            <Icon size={16} color={color} />
            <span>{label}</span>
          </button>
        ))}
        <button className="mobile-action-btn btn-run-ci" onClick={onRunPipeline} disabled={isPipelineRunning}>
          <Play size={15} />
          <span>{isPipelineRunning ? 'Running Pipeline...' : 'Trigger Pipeline'}</span>
        </button>
      </aside>
    )
  }

  return (
    <div className="nav-actions desktop-actions">
      {QUICK_ACTIONS.map(({ modal, label, icon: Icon, color, border, title }) => (
        <button
          key={modal}
          className="action-btn btn-ghost"
          style={border ? { border } : undefined}
          title={title}
          onClick={() => onOpenModal(modal)}
        >
          <Icon size={14} color={color} />
          {label}
        </button>
      ))}
      <button className="action-btn btn-primary" onClick={onRunPipeline} disabled={isPipelineRunning}>
        <Play size={14} />
        Run CI/CD
      </button>
    </div>
  )
}
