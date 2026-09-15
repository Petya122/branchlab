import React from 'react'
import type { PipelineFailureConfig, PipelineRun, PipelineStage } from '../types/pipeline'
import {
  FileCheck,
  TestTube2,
  ShieldCheck,
  PackageCheck,
  CloudUpload,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Clock,
  ExternalLink,
} from 'lucide-react'

interface PipelineViewerProps {
  run: PipelineRun
  selectedStageId: string | null
  chaosConfig: PipelineFailureConfig
  isRunning: boolean
  onRunPipeline: () => void
  onSelectStage: (stage: PipelineStage) => void
  onToggleChaos: (key: keyof PipelineFailureConfig) => void
}

export const PipelineViewer: React.FC<PipelineViewerProps> = ({
  run,
  selectedStageId,
  chaosConfig,
  isRunning,
  onRunPipeline,
  onSelectStage,
  onToggleChaos,
}) => {
  const getStageIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileCheck':
        return <FileCheck size={16} />
      case 'TestTube2':
        return <TestTube2 size={16} />
      case 'ShieldCheck':
        return <ShieldCheck size={16} />
      case 'PackageCheck':
        return <PackageCheck size={16} />
      case 'CloudUpload':
        return <CloudUpload size={16} />
      default:
        return <FileCheck size={16} />
    }
  }

  const getStatusIcon = (status: PipelineStage['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 size={16} color="#34d399" />
      case 'failed':
        return <XCircle size={16} color="#f87171" />
      case 'running':
        return <Loader2 size={16} color="#38bdf8" className="spin" />
      default:
        return <Clock size={16} color="#64748b" />
    }
  }

  const totalDuration = run.stages.reduce((acc, s) => acc + s.durationMs, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Pipeline Status Banner */}
      <div className="pipeline-status-card">
        <div className="pipeline-status-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`pipeline-badge status-${run.status}`}>{run.status}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              branch: <strong style={{ color: '#38bdf8' }}>{run.branch}</strong>
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            commit: <code style={{ color: '#94a3b8' }}>{run.commitHash}</code> • trigger: {run.trigger}
            {totalDuration > 0 ? ` • ${totalDuration}ms` : ''}
          </span>
        </div>

        <button
          className="action-btn btn-primary"
          onClick={onRunPipeline}
          disabled={isRunning}
          style={{ opacity: isRunning ? 0.7 : 1 }}
        >
          {isRunning ? <Loader2 size={14} className="spin" /> : <Play size={14} />}
          {isRunning ? 'Running...' : 'Run Pipeline'}
        </button>
      </div>

      {/* Stage Stepper List */}
      <div className="stages-list">
        {run.stages.map((stage) => {
          const isSelected = selectedStageId === stage.id
          return (
            <div
              key={stage.id}
              className={`stage-card ${stage.status === 'running' ? 'stage-running' : ''} ${
                isSelected ? 'selected' : ''
              }`}
              onClick={() => onSelectStage(stage)}
            >
              <div className="stage-left">
                <div
                  className="stage-icon-box"
                  style={{
                    color:
                      stage.status === 'success'
                        ? '#34d399'
                        : stage.status === 'failed'
                        ? '#f87171'
                        : stage.status === 'running'
                        ? '#38bdf8'
                        : 'var(--text-muted)',
                  }}
                >
                  {getStageIcon(stage.iconName)}
                </div>
                <div>
                  <div className="stage-title">{stage.name}</div>
                  <div className="stage-desc">{stage.description}</div>
                </div>
              </div>

              <div className="stage-right">
                {stage.durationMs > 0 && (
                  <span className="stage-duration">{stage.durationMs}ms</span>
                )}
                {getStatusIcon(stage.status)}
              </div>
            </div>
          )
        })}
      </div>

      {/* Vercel Deployment Link Preview if deploy succeeded */}
      {run.stages.find((s) => s.id === 'deploy')?.status === 'success' && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="#34d399" />
            <span style={{ fontSize: '12px', color: '#34d399' }}>
              Deployment Live on <strong>branchlab.me</strong>
            </span>
          </div>
          <a
            href="https://branchlab.me"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: '#38bdf8',
              textDecoration: 'none',
            }}
          >
            Visit <ExternalLink size={12} />
          </a>
        </div>
      )}

      {/* Chaos Mode / Error Injection (DevOps Testing Showcase) */}
      <div className="chaos-panel">
        <div className="chaos-title">
          <AlertTriangle size={14} />
          Chaos Injection Controls (Simulate CI Failures)
        </div>
        <div className="chaos-toggles">
          <button
            className={`chaos-toggle-btn ${chaosConfig.failLint ? 'active' : ''}`}
            onClick={() => onToggleChaos('failLint')}
          >
            {chaosConfig.failLint ? '❌ Lint Fails' : '✓ Lint Passes'}
          </button>
          <button
            className={`chaos-toggle-btn ${chaosConfig.failTests ? 'active' : ''}`}
            onClick={() => onToggleChaos('failTests')}
          >
            {chaosConfig.failTests ? '❌ Tests Fail' : '✓ Tests Pass'}
          </button>
          <button
            className={`chaos-toggle-btn ${chaosConfig.failSecurity ? 'active' : ''}`}
            onClick={() => onToggleChaos('failSecurity')}
          >
            {chaosConfig.failSecurity ? '❌ CVE Alert' : '✓ Security Clean'}
          </button>
          <button
            className={`chaos-toggle-btn ${chaosConfig.failBuild ? 'active' : ''}`}
            onClick={() => onToggleChaos('failBuild')}
          >
            {chaosConfig.failBuild ? '❌ Build Fails' : '✓ Build Passes'}
          </button>
        </div>
      </div>
    </div>
  )
}
