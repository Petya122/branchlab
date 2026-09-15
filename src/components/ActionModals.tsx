import React, { useState } from 'react'
import type { GitGraphState } from '../types/git'
import { X, GitBranch, GitCommit, GitMerge } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
}

interface CommitModalProps extends ModalProps {
  activeBranch: string
  onCommit: (message: string) => void
}

export const CommitModal: React.FC<CommitModalProps> = ({
  isOpen,
  onClose,
  activeBranch,
  onCommit,
}) => {
  const [msg, setMsg] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!msg.trim()) return
    onCommit(msg.trim())
    setMsg('')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600 }}>
            <GitCommit size={18} color="#38bdf8" />
            <span>Create New Commit</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Active Branch</label>
            <input className="form-input" disabled value={activeBranch} />
          </div>

          <div className="form-group">
            <label className="form-label">Commit Message</label>
            <input
              className="form-input"
              autoFocus
              placeholder="feat: add responsive layout"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="action-btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="action-btn btn-primary" disabled={!msg.trim()}>
              Commit Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface BranchModalProps extends ModalProps {
  state: GitGraphState
  onCreateBranch: (branchName: string, fromBranch: string) => void
}

export const BranchModal: React.FC<BranchModalProps> = ({
  isOpen,
  onClose,
  state,
  onCreateBranch,
}) => {
  const [name, setName] = useState('')
  const [fromBranch, setFromBranch] = useState(state.activeBranch)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onCreateBranch(name.trim(), fromBranch)
    setName('')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600 }}>
            <GitBranch size={18} color="#a855f7" />
            <span>Create New Branch</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Branch Off From</label>
            <select
              className="form-input"
              value={fromBranch}
              onChange={(e) => setFromBranch(e.target.value)}
            >
              {Object.keys(state.branches).map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">New Branch Name</label>
            <input
              className="form-input"
              autoFocus
              placeholder="feature/payment or hotfix/patch"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="action-btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="action-btn btn-primary" disabled={!name.trim()}>
              Create Branch
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface MergeModalProps extends ModalProps {
  state: GitGraphState
  onMerge: (sourceBranch: string, targetBranch: string) => void
}

export const MergeModal: React.FC<MergeModalProps> = ({
  isOpen,
  onClose,
  state,
  onMerge,
}) => {
  const branchList = Object.keys(state.branches)
  const defaultSource = branchList.find((b) => b !== 'main') || branchList[0]
  const [source, setSource] = useState(defaultSource)
  const [target, setTarget] = useState('main')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (source === target) return
    onMerge(source, target)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600 }}>
            <GitMerge size={18} color="#10b981" />
            <span>Merge Branches</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Source Branch (Merge FROM)</label>
            <select className="form-input" value={source} onChange={(e) => setSource(e.target.value)}>
              {branchList.map((b) => (
                <option key={`src-${b}`} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Target Branch (Merge INTO)</label>
            <select className="form-input" value={target} onChange={(e) => setTarget(e.target.value)}>
              {branchList.map((b) => (
                <option key={`tgt-${b}`} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {source === target && (
            <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>
              Source and target branches must be different.
            </p>
          )}

          <div className="modal-actions">
            <button type="button" className="action-btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="action-btn btn-primary" disabled={source === target}>
              Confirm Merge
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
