import React, { useState } from 'react'
import { AlertTriangle, GitMerge, X, ArrowDown } from 'lucide-react'

interface MergeConflictModalProps {
  isOpen: boolean
  sourceBranch: string
  targetBranch: string
  onClose: () => void
  onResolve: (strategy: 'current' | 'incoming' | 'both') => void
}

export const MergeConflictModal: React.FC<MergeConflictModalProps> = ({
  isOpen,
  sourceBranch,
  targetBranch,
  onClose,
  onResolve,
}) => {
  const [selectedResolution, setSelectedResolution] = useState<'current' | 'incoming' | 'both'>('incoming')

  if (!isOpen) return null

  const getResolvedCode = () => {
    if (selectedResolution === 'current') {
      return `// Resolved using Current Change (${targetBranch})
export const API_BASE = "https://api.branchlab.me/v1";
export const MAX_RETRY_COUNT = 3;
export const AUTH_PROVIDER = "sso-oauth2";`
    }
    if (selectedResolution === 'incoming') {
      return `// Resolved using Incoming Change (${sourceBranch})
export const API_BASE = "https://api.branchlab.me/v2-edge";
export const MAX_RETRY_COUNT = 5;
export const AUTH_PROVIDER = "sso-oauth2-pkce";`
    }
    return `// Resolved combining Both Changes
export const API_BASE_V1 = "https://api.branchlab.me/v1";
export const API_BASE_V2 = "https://api.branchlab.me/v2-edge";
export const MAX_RETRY_COUNT = 5;
export const AUTH_PROVIDER = "sso-oauth2-pkce";`
  }

  const handleConfirm = () => {
    onResolve(selectedResolution)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                Merge Conflict in <code>src/config/api.ts</code>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Merging <strong>{sourceBranch}</strong> into <strong>{targetBranch}</strong>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Git Conflict Raw Diff View */}
        <div
          style={{
            background: '#04070e',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            lineHeight: '1.5',
            marginBottom: '16px',
            overflowX: 'auto',
          }}
        >
          <div style={{ color: '#f59e0b', fontWeight: 'bold' }}>
            {'<<<<<<< HEAD (' + targetBranch + ')'}
          </div>
          <div style={{ color: '#94a3b8', background: 'rgba(56, 189, 248, 0.08)', padding: '2px 4px' }}>
            export const API_BASE = "https://api.branchlab.me/v1";<br />
            export const MAX_RETRY_COUNT = 3;<br />
            export const AUTH_PROVIDER = "sso-oauth2";
          </div>
          <div style={{ color: '#64748b', fontWeight: 'bold' }}>{'======='}</div>
          <div style={{ color: '#94a3b8', background: 'rgba(168, 85, 247, 0.08)', padding: '2px 4px' }}>
            export const API_BASE = "https://api.branchlab.me/v2-edge";<br />
            export const MAX_RETRY_COUNT = 5;<br />
            export const AUTH_PROVIDER = "sso-oauth2-pkce";
          </div>
          <div style={{ color: '#a855f7', fontWeight: 'bold' }}>
            {'>>>>>>> ' + sourceBranch}
          </div>
        </div>

        {/* Resolution Options */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Choose Resolution Strategy:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              className={`chaos-toggle-btn ${selectedResolution === 'current' ? 'active' : ''}`}
              style={{ padding: '8px 10px', textAlign: 'center' }}
              onClick={() => setSelectedResolution('current')}
            >
              Accept Current ({targetBranch})
            </button>
            <button
              type="button"
              className={`chaos-toggle-btn ${selectedResolution === 'incoming' ? 'active' : ''}`}
              style={{ padding: '8px 10px', textAlign: 'center' }}
              onClick={() => setSelectedResolution('incoming')}
            >
              Accept Incoming ({sourceBranch})
            </button>
            <button
              type="button"
              className={`chaos-toggle-btn ${selectedResolution === 'both' ? 'active' : ''}`}
              style={{ padding: '8px 10px', textAlign: 'center' }}
              onClick={() => setSelectedResolution('both')}
            >
              Accept Both (Combine)
            </button>
          </div>
        </div>

        {/* Live Resolved Output Preview */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <ArrowDown size={12} /> Resolved Output Preview:
          </div>
          <pre
            style={{
              background: '#070b14',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              color: '#34d399',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              whiteSpace: 'pre-wrap',
            }}
          >
            {getResolvedCode()}
          </pre>
        </div>

        {/* Modal Actions */}
        <div className="modal-actions">
          <button type="button" className="action-btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="action-btn btn-primary" onClick={handleConfirm}>
            <GitMerge size={14} />
            Resolve Conflict & Commit
          </button>
        </div>
      </div>
    </div>
  )
}
