import React from 'react'
import { GitBranch, Play, Terminal } from 'lucide-react'
import type { Commit, GitGraphState } from '../types/git'
import type { PipelineFailureConfig, PipelineRun, PipelineStage } from '../types/pipeline'
import type { Scenario } from '../utils/scenarios'
import { GitCanvas } from './GitCanvas'
import { PipelineViewer } from './PipelineViewer'
import { TerminalConsole } from './TerminalConsole'

interface LabDashboardProps {
  gitState: GitGraphState
  selectedCommit: Commit | null
  onSelectCommit: (commit: Commit) => void
  pipelineRun: PipelineRun
  selectedStageId: string | null
  onSelectStage: (stage: PipelineStage) => void
  chaosConfig: PipelineFailureConfig
  isPipelineRunning: boolean
  onRunPipeline: () => void
  onToggleChaos: (key: keyof PipelineFailureConfig) => void
  logs: string[]
  scenario: Scenario
  onCommand: (cmd: string) => void
  onNextScenario: () => void
}

/** Details of the commit clicked in the graph. */
const CommitInspector: React.FC<{ commit: Commit }> = ({ commit }) => (
  <div
    style={{
      marginTop: '12px',
      background: 'var(--bg-surface-elevated)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 14px',
      fontSize: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}
  >
    <div>
      <span style={{ color: 'var(--text-muted)' }}>Selected Commit: </span>
      <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{commit.hash}</strong>
      <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>{commit.message}</div>
    </div>
    <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '11px' }}>
      branch: <strong style={{ color: '#a855f7' }}>{commit.branch}</strong>
      <div>{commit.author}</div>
    </div>
  </div>
)

/** The three lab panels: git graph, CI/CD pipeline and terminal. */
export const LabDashboard: React.FC<LabDashboardProps> = (props) => (
  <main className="dashboard-grid">
    <section className="card-panel">
      <div className="panel-header">
        <div className="panel-title">
          <GitBranch size={16} color="#38bdf8" />
          Git Branching Visualizer
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {props.gitState.commits.length} commits • active:{' '}
          <strong style={{ color: '#38bdf8' }}>{props.gitState.activeBranch}</strong>
        </span>
      </div>
      <div className="panel-body">
        <GitCanvas
          state={props.gitState}
          selectedCommitId={props.selectedCommit?.id || null}
          onSelectCommit={props.onSelectCommit}
        />
        {props.selectedCommit && <CommitInspector commit={props.selectedCommit} />}
      </div>
    </section>

    <section className="card-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Play size={16} color="#10b981" />
          CI/CD Pipeline Simulator
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>mirrors the real GitHub Actions workflow</span>
      </div>
      <div className="panel-body">
        <PipelineViewer
          run={props.pipelineRun}
          selectedStageId={props.selectedStageId}
          chaosConfig={props.chaosConfig}
          isRunning={props.isPipelineRunning}
          onRunPipeline={props.onRunPipeline}
          onSelectStage={props.onSelectStage}
          onToggleChaos={props.onToggleChaos}
        />
      </div>
    </section>

    <section className="card-panel console-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Terminal size={16} color="#a855f7" />
          DevOps Lab & Terminal
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Interactive Shell</span>
      </div>
      <div className="panel-body">
        <TerminalConsole
          logs={props.logs}
          currentScenario={props.scenario}
          onCommand={props.onCommand}
          onNextScenario={props.onNextScenario}
        />
      </div>
    </section>
  </main>
)
