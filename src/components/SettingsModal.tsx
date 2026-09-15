import React from 'react'
import {
  X,
  Settings as SettingsIcon,
  Zap,
  ShieldAlert,
  RotateCcw,
  Download,
  Check,
  GitBranch,
  Trash2,
} from 'lucide-react'
import type { SettingsState } from '../utils/settings'
import type { GitGraphState } from '../types/git'
import type { TrophyState } from '../utils/trophies'

interface SettingsModalProps {
  isOpen: boolean
  settings: SettingsState
  gitState: GitGraphState
  trophyState: TrophyState
  onClose: () => void
  onUpdateSettings: (next: SettingsState) => void
  onResetTrophies: () => void
  onResetTour: () => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  gitState,
  trophyState,
  onClose,
  onUpdateSettings,
  onResetTrophies,
  onResetTour,
}) => {
  if (!isOpen) return null

  const handleExportData = () => {
    const exportData = {
      app: 'BranchLab',
      domain: 'branchlab.me',
      exportedAt: new Date().toISOString(),
      settings,
      trophyState,
      gitState: {
        model: gitState.model,
        activeBranch: gitState.activeBranch,
        commitsCount: gitState.commits.length,
        commits: gitState.commits,
      },
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `branchlab-session-${Date.now()}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const handleClearCache = () => {
    if (
      confirm(
        'Are you sure you want to clear all browser cache and reset BranchLab to factory defaults? All settings, trophies, and tour history will be reset.'
      )
    ) {
      try {
        localStorage.clear()
        window.location.reload()
      } catch {
        // fallback
      }
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <SettingsIcon size={18} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                BranchLab Settings
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Configure simulation rules, visuals, and browser storage
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Setting 1: Animation Speed */}
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={14} color="#38bdf8" /> Animation & Pulse Speed
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {(['fast', 'normal', 'relaxed'] as const).map((speed) => (
              <button
                key={speed}
                type="button"
                className={`chaos-toggle-btn ${settings.animationSpeed === speed ? 'active' : ''}`}
                style={{ textTransform: 'capitalize', padding: '6px 10px' }}
                onClick={() => onUpdateSettings({ ...settings, animationSpeed: speed })}
              >
                {speed === 'fast' ? '⚡ Fast' : speed === 'normal' ? '⏱️ Normal' : '🌿 Relaxed'}
              </button>
            ))}
          </div>
        </div>

        {/* Setting 2: Strict Branch Protection */}
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={14} color="#10b981" /> Strict Branch Protection
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Require 100% green CI/CD pipeline checks before Pull Request merges
            </div>
            <button
              type="button"
              className={`chaos-toggle-btn ${settings.strictBranchProtection ? 'active' : ''}`}
              onClick={() => onUpdateSettings({ ...settings, strictBranchProtection: !settings.strictBranchProtection })}
            >
              {settings.strictBranchProtection ? '✓ Enforced' : 'Permissive'}
            </button>
          </div>
        </div>

        {/* Setting 3: Default Model on Load */}
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GitBranch size={14} color="#a855f7" /> Default Branching Strategy
          </label>
          <select
            className="form-input"
            value={settings.defaultModel}
            onChange={(e) =>
              onUpdateSettings({
                ...settings,
                defaultModel: e.target.value as 'gitflow' | 'trunk-based' | 'github-flow',
              })
            }
          >
            <option value="gitflow">GitFlow (main, develop, feature/*)</option>
            <option value="trunk-based">Trunk-Based Development (fast short-lived)</option>
            <option value="github-flow">GitHub Flow (PR to main)</option>
          </select>
        </div>

        {/* Setting 4: Data Management & Export */}
        <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Data Management & Lab Export
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              type="button"
              className="action-btn btn-ghost"
              style={{ fontSize: '11px', padding: '6px 12px' }}
              onClick={handleExportData}
            >
              <Download size={13} color="#38bdf8" /> Export Session (.json)
            </button>
            <button
              type="button"
              className="action-btn btn-ghost"
              style={{ fontSize: '11px', padding: '6px 12px' }}
              onClick={() => {
                onResetTour()
                alert('Onboarding tour reset! It will show again on next startup or when clicking Tour.')
              }}
            >
              <RotateCcw size={13} color="#f59e0b" /> Reset Tour
            </button>
            <button
              type="button"
              className="action-btn btn-ghost"
              style={{ fontSize: '11px', padding: '6px 12px', color: '#f87171' }}
              onClick={() => {
                if (confirm('Are you sure you want to reset all earned trophies and XP back to zero?')) {
                  onResetTrophies()
                }
              }}
            >
              Reset Trophies & XP
            </button>
            <button
              type="button"
              className="action-btn btn-ghost"
              style={{ fontSize: '11px', padding: '6px 12px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.35)' }}
              onClick={handleClearCache}
            >
              <Trash2 size={13} color="#ef4444" /> Clear Cache & Reset
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button type="button" className="action-btn btn-primary" onClick={onClose}>
            <Check size={14} /> Save & Close
          </button>
        </div>
      </div>
    </div>
  )
}
