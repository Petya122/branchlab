import React, { useState } from 'react'
import {
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertOctagon,
  X,
  FileCode2,
  GitCommit,
} from 'lucide-react'

interface PullRequestModalProps {
  isOpen: boolean
  sourceBranch: string
  targetBranch: string
  ciStatus: 'idle' | 'running' | 'passed' | 'failed'
  onClose: () => void
  onMergePR: (title: string) => void
}

export const PullRequestModal: React.FC<PullRequestModalProps> = ({
  isOpen,
  sourceBranch,
  targetBranch,
  ciStatus,
  onClose,
  onMergePR,
}) => {
  const [prTitle, setPrTitle] = useState(`feat: integrate ${sourceBranch} updates`)
  const [activeTab, setActiveTab] = useState<'checks' | 'diff'>('checks')

  if (!isOpen) return null

  const isMergeable = ciStatus === 'passed'

  const handleMerge = () => {
    if (!isMergeable) return
    onMergePR(prTitle)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  background: 'rgba(168, 85, 247, 0.15)',
                  color: '#c084fc',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <GitPullRequest size={12} /> Open PR #24
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                into <code style={{ color: '#10b981' }}>{targetBranch}</code> from <code style={{ color: '#a855f7' }}>{sourceBranch}</code>
              </span>
            </div>
            <input
              type="text"
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
              className="form-input"
              style={{ marginTop: '8px', fontSize: '15px', fontWeight: '600' }}
            />
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '14px' }}>
          <button
            type="button"
            className={`model-button ${activeTab === 'checks' ? 'active' : ''}`}
            onClick={() => setActiveTab('checks')}
          >
            <ShieldCheck size={14} /> Branch Protection & CI Checks
          </button>
          <button
            type="button"
            className={`model-button ${activeTab === 'diff' ? 'active' : ''}`}
            onClick={() => setActiveTab('diff')}
          >
            <FileCode2 size={14} /> Files Changed (1)
          </button>
        </div>

        {/* Tab 1: Checks & Gatekeeper */}
        {activeTab === 'checks' && (
          <div style={{ marginBottom: '18px' }}>
            <div
              style={{
                background:
                  ciStatus === 'passed'
                    ? 'rgba(16, 185, 129, 0.06)'
                    : ciStatus === 'failed'
                    ? 'rgba(239, 68, 68, 0.06)'
                    : 'var(--bg-surface-elevated)',
                border: `1px solid ${
                  ciStatus === 'passed'
                    ? 'rgba(16, 185, 129, 0.3)'
                    : ciStatus === 'failed'
                    ? 'rgba(239, 68, 68, 0.3)'
                    : 'var(--border-subtle)'
                }`,
                borderRadius: 'var(--radius-md)',
                padding: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '13px' }}>
                  {ciStatus === 'passed' ? (
                    <>
                      <CheckCircle2 size={18} color="#34d399" />
                      <span style={{ color: '#34d399' }}>All checks have passed</span>
                    </>
                  ) : ciStatus === 'failed' ? (
                    <>
                      <XCircle size={18} color="#f87171" />
                      <span style={{ color: '#f87171' }}>Required checks failed</span>
                    </>
                  ) : (
                    <>
                      <Clock size={18} color="#94a3b8" />
                      <span style={{ color: '#94a3b8' }}>CI Pipeline not yet passed</span>
                    </>
                  )}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Rule: Require status checks before merging
                </span>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {ciStatus === 'passed' ? (
                  <div>
                    ✓ <strong>BranchLab CI</strong> (Lint, Vitest Unit Tests & Vite Build) succeeded.
                    <br />
                    This branch has no conflicts with <code>{targetBranch}</code> and is ready to merge.
                  </div>
                ) : (
                  <div>
                    ❌ <strong>Branch protection rule active:</strong> Merging is blocked until all CI/CD pipeline checks are green.
                    <br />
                    <span style={{ color: '#f87171' }}>
                      Run the pipeline or disable failing chaos checks to unblock this PR.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Files Changed Diff */}
        {activeTab === 'diff' && (
          <div
            style={{
              background: '#05080f',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              marginBottom: '18px',
              maxHeight: '180px',
              overflowY: 'auto',
            }}
          >
            <div style={{ color: '#38bdf8', marginBottom: '6px' }}>diff --git a/src/App.tsx b/src/App.tsx</div>
            <div style={{ color: '#ef4444' }}>- const API_ENDPOINT = "https://legacy-api.branchlab.me";</div>
            <div style={{ color: '#10b981' }}>+ const API_ENDPOINT = "https://branchlab.me/api/v2";</div>
            <div style={{ color: '#10b981' }}>+ export const FEATURE_FLAGS = {'{'} ssoAuth: true {'}'};</div>
          </div>
        )}

        {/* Merge Button Footer */}
        <div className="modal-actions" style={{ alignItems: 'center' }}>
          {!isMergeable && (
            <span style={{ fontSize: '11px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertOctagon size={12} /> Merge blocked by CI gate
            </span>
          )}
          <button type="button" className="action-btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="action-btn btn-primary"
            disabled={!isMergeable}
            onClick={handleMerge}
            style={{
              background: isMergeable ? 'linear-gradient(135deg, #059669, #10b981)' : undefined,
              borderColor: isMergeable ? 'rgba(52, 211, 153, 0.4)' : undefined,
            }}
          >
            <GitCommit size={14} />
            Confirm Squash & Merge
          </button>
        </div>
      </div>
    </div>
  )
}
