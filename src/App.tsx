import React, { useState } from 'react'
import confetti from 'canvas-confetti'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import type {
  BranchingModel,
  Commit,
  GitGraphState,
} from './types/git'
import type {
  PipelineFailureConfig,
  PipelineRun,
} from './types/pipeline'
import {
  checkoutBranch,
  commitToActiveBranch,
  createBranch,
  getInitialGitState,
  mergeBranches,
} from './utils/gitEngine'
import {
  createInitialPipelineRun,
  generateStageLogs,
  shouldStageFail,
} from './utils/pipelineEngine'
import { SCENARIOS } from './utils/scenarios'
import type { Scenario } from './utils/scenarios'
import { GitCanvas } from './components/GitCanvas'
import { PipelineViewer } from './components/PipelineViewer'
import { TerminalConsole } from './components/TerminalConsole'
import { BranchModal, CommitModal, MergeModal } from './components/ActionModals'
import {
  GitBranch,
  GitCommit,
  GitMerge,
  Play,
  Terminal,
  Globe,
  Layers,
} from 'lucide-react'

export const App: React.FC = () => {
  const [model, setModel] = useState<BranchingModel>('gitflow')
  const [gitState, setGitState] = useState<GitGraphState>(() => getInitialGitState('gitflow'))
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null)

  // Pipeline State
  const [pipelineRun, setPipelineRun] = useState<PipelineRun>(() =>
    createInitialPipelineRun('5d88e2b', 'feat(auth): implement student sso oauth flow', 'feature/auth')
  )
  const [selectedStageId, setSelectedStageId] = useState<string | null>('lint')
  const [isPipelineRunning, setIsPipelineRunning] = useState(false)
  const [chaosConfig, setChaosConfig] = useState<PipelineFailureConfig>({
    failLint: false,
    failTests: false,
    failSecurity: false,
    failBuild: false,
  })

  // Console & Scenarios State
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const currentScenario: Scenario = SCENARIOS[scenarioIndex]
  const [logs, setLogs] = useState<string[]>([
    '$ git status',
    'On branch feature/auth',
    'Your branch is up to date with origin/feature/auth.',
    'System ready. Select a model or run pipeline checks.',
  ])

  // Modals
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false)
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false)
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false)

  // When model changes, reset graph
  const handleModelChange = (newModel: BranchingModel) => {
    setModel(newModel)
    const nextState = getInitialGitState(newModel)
    setGitState(nextState)
    setSelectedCommit(null)
    const latestCommit = nextState.commits[nextState.commits.length - 1]
    setPipelineRun(
      createInitialPipelineRun(
        latestCommit.hash,
        latestCommit.message,
        nextState.activeBranch
      )
    )
    setLogs((prev) => [
      ...prev,
      `$ switched branching strategy to ${newModel.toUpperCase()}`,
      `Active branch: ${nextState.activeBranch}`,
    ])
  }

  // Run CI/CD Pipeline Simulator
  const handleRunPipeline = async () => {
    if (isPipelineRunning) return
    setIsPipelineRunning(true)

    const activeCommit = gitState.commits.find((c) => c.id === gitState.headCommitId)
    const commitHash = activeCommit ? activeCommit.hash : 'head000'
    const commitMsg = activeCommit ? activeCommit.message : 'manual trigger'

    let currentRun = createInitialPipelineRun(commitHash, commitMsg, gitState.activeBranch)
    currentRun.status = 'running'
    currentRun.startedAt = Date.now()
    setPipelineRun({ ...currentRun })

    setLogs((prev) => [
      ...prev,
      `\n--- [CI/CD TRIGGERED] On branch '${gitState.activeBranch}' (${commitHash}) ---`,
    ])

    let hasFailed = false
    const updatedStages = [...currentRun.stages]

    for (let i = 0; i < updatedStages.length; i++) {
      const stage = updatedStages[i]

      // Set stage running
      stage.status = 'running'
      setSelectedStageId(stage.id)
      setPipelineRun({ ...currentRun, stages: [...updatedStages] })

      // Artificial realistic delay (350ms - 550ms)
      await new Promise((r) => setTimeout(r, 450))

      const fails = shouldStageFail(stage.id, chaosConfig)
      const stageLogs = generateStageLogs(
        stage.id,
        !fails,
        gitState.activeBranch,
        commitHash
      )

      stage.logs = stageLogs
      stage.durationMs = 400 + Math.floor(Math.random() * 200)

      setLogs((prev) => [...prev, ...stageLogs])

      if (fails) {
        stage.status = 'failed'
        hasFailed = true
        currentRun.status = 'failed'
        setPipelineRun({ ...currentRun, stages: [...updatedStages] })
        break
      } else {
        stage.status = 'success'
        setPipelineRun({ ...currentRun, stages: [...updatedStages] })
      }
    }

    if (!hasFailed) {
      currentRun.status = 'passed'
      setPipelineRun({ ...currentRun, status: 'passed' })
      setLogs((prev) => [
        ...prev,
        `[CI/CD RESULT] All checks passed! Production release live on https://branchlab.me ✨`,
      ])

      // Celebration confetti for successful release
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
      })
    } else {
      setLogs((prev) => [
        ...prev,
        `[CI/CD RESULT] Pipeline terminated with errors. Deployment aborted. ❌`,
      ])
    }

    setIsPipelineRunning(false)
  }

  // Handle Commit
  const handleCommit = (message: string) => {
    const { nextState, newCommit } = commitToActiveBranch(gitState, message)
    setGitState(nextState)
    setSelectedCommit(newCommit)
    setLogs((prev) => [
      ...prev,
      `$ git commit -m "${message}"`,
      `[${newCommit.branch} ${newCommit.hash}] ${message}`,
    ])
    // Auto-prepare new pipeline run
    setPipelineRun(
      createInitialPipelineRun(newCommit.hash, newCommit.message, newCommit.branch)
    )
  }

  // Handle Create Branch
  const handleCreateBranch = (branchName: string, fromBranch: string) => {
    try {
      const nextState = createBranch(gitState, branchName, fromBranch)
      setGitState(nextState)
      setLogs((prev) => [
        ...prev,
        `$ git checkout -b ${branchName} ${fromBranch}`,
        `Switched to a new branch '${branchName}'`,
      ])
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      setLogs((prev) => [...prev, `[ERROR] ${errMsg}`])
    }
  }

  // Handle Merge
  const handleMerge = (source: string, target: string) => {
    try {
      const { nextState, mergeCommit } = mergeBranches(gitState, source, target)
      setGitState(nextState)
      setSelectedCommit(mergeCommit)
      setLogs((prev) => [
        ...prev,
        `$ git checkout ${target}`,
        `$ git merge ${source}`,
        `Merged branch '${source}' into ${target} [${mergeCommit.hash}]`,
      ])
      setPipelineRun(
        createInitialPipelineRun(
          mergeCommit.hash,
          mergeCommit.message,
          mergeCommit.branch
        )
      )
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      setLogs((prev) => [...prev, `[ERROR] ${errMsg}`])
    }
  }

  // Toggle Chaos
  const handleToggleChaos = (key: keyof PipelineFailureConfig) => {
    setChaosConfig((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      setLogs((l) => [
        ...l,
        `[CHAOS CONTROL] ${key} is now ${next[key] ? 'ENABLED (Will Fail)' : 'DISABLED (Will Pass)'}`,
      ])
      return next
    })
  }

  // Terminal CLI input parser
  const handleTerminalCommand = (cmd: string) => {
    setLogs((prev) => [...prev, `$ ${cmd}`])
    const lower = cmd.trim().toLowerCase()

    if (lower === 'help') {
      setLogs((prev) => [
        ...prev,
        'Available commands:',
        '  git commit -m "<message>"      - Commit changes to current branch',
        '  git checkout -b <new_branch>  - Create and switch to new branch',
        '  git checkout <branch>          - Switch active branch',
        '  git merge <source_branch>      - Merge source branch into active',
        '  git status                     - Show active branch and status',
        '  run pipeline                   - Trigger CI/CD runner',
        '  clear                          - Clear terminal output',
      ])
      return
    }

    if (lower === 'clear') {
      setLogs([])
      return
    }

    if (lower === 'run pipeline' || lower === 'ci' || lower === 'deploy') {
      handleRunPipeline()
      return
    }

    if (lower === 'git status') {
      setLogs((prev) => [
        ...prev,
        `On branch ${gitState.activeBranch}`,
        `Head commit: ${gitState.headCommitId}`,
        `Total commits in graph: ${gitState.commits.length}`,
      ])
      return
    }

    // git commit -m "..."
    const commitMatch = cmd.match(/^git commit -m ["'](.+)["']$/i)
    if (commitMatch) {
      handleCommit(commitMatch[1])
      return
    }

    // git checkout -b <branch>
    const checkoutNewMatch = cmd.match(/^git checkout -b ([a-zA-Z0-9_\-\/]+)$/i)
    if (checkoutNewMatch) {
      handleCreateBranch(checkoutNewMatch[1], gitState.activeBranch)
      return
    }

    // git checkout <branch>
    const checkoutMatch = cmd.match(/^git checkout ([a-zA-Z0-9_\-\/]+)$/i)
    if (checkoutMatch) {
      const branchName = checkoutMatch[1]
      try {
        const nextState = checkoutBranch(gitState, branchName)
        setGitState(nextState)
        setLogs((prev) => [...prev, `Switched to branch '${branchName}'`])
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err)
        setLogs((prev) => [...prev, `[ERROR] ${errMsg}`])
      }
      return
    }

    // git merge <source>
    const mergeMatch = cmd.match(/^git merge ([a-zA-Z0-9_\-\/]+)$/i)
    if (mergeMatch) {
      handleMerge(mergeMatch[1], gitState.activeBranch)
      return
    }

    setLogs((prev) => [
      ...prev,
      `Command not recognized: "${cmd}". Type 'help' for available commands.`,
    ])
  }

  const handleNextScenario = () => {
    const nextIdx = (scenarioIndex + 1) % SCENARIOS.length
    setScenarioIndex(nextIdx)
    const sc = SCENARIOS[nextIdx]
    handleModelChange(sc.initialModel)
    setLogs((prev) => [
      ...prev,
      `\n🎯 Loaded Challenge: ${sc.title}`,
      `Objective: ${sc.objective}`,
    ])
  }

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <header className="navbar">
        <div className="brand-section">
          <div className="brand-logo">
            <Layers size={22} />
          </div>
          <div className="brand-info">
            <h1>
              BranchLab
              <a
                href="https://branchlab.me"
                target="_blank"
                rel="noopener noreferrer"
                className="domain-badge"
                title="Target Production Domain"
              >
                <Globe size={11} />
                branchlab.me
              </a>
            </h1>
          </div>
        </div>

        {/* Branching Strategy Switcher */}
        <div className="model-selector">
          <button
            className={`model-button ${model === 'gitflow' ? 'active' : ''}`}
            onClick={() => handleModelChange('gitflow')}
          >
            <GitBranch size={13} />
            GitFlow
          </button>
          <button
            className={`model-button ${model === 'trunk-based' ? 'active' : ''}`}
            onClick={() => handleModelChange('trunk-based')}
          >
            <GitCommit size={13} />
            Trunk-Based
          </button>
          <button
            className={`model-button ${model === 'github-flow' ? 'active' : ''}`}
            onClick={() => handleModelChange('github-flow')}
          >
            <GitMerge size={13} />
            GitHub Flow
          </button>
        </div>

        {/* Quick Actions */}
        <div className="nav-actions">
          <button
            className="action-btn btn-ghost"
            onClick={() => setIsCommitModalOpen(true)}
          >
            <GitCommit size={14} color="#38bdf8" />
            Commit
          </button>
          <button
            className="action-btn btn-ghost"
            onClick={() => setIsBranchModalOpen(true)}
          >
            <GitBranch size={14} color="#a855f7" />
            Branch
          </button>
          <button
            className="action-btn btn-ghost"
            onClick={() => setIsMergeModalOpen(true)}
          >
            <GitMerge size={14} color="#10b981" />
            Merge
          </button>
          <button
            className="action-btn btn-primary"
            onClick={handleRunPipeline}
            disabled={isPipelineRunning}
          >
            <Play size={14} />
            Run CI/CD
          </button>
        </div>
      </header>

      {/* Main 3-Column Dashboard */}
      <main className="dashboard-grid">
        {/* Panel 1: Interactive Git Graph Canvas */}
        <section className="card-panel">
          <div className="panel-header">
            <div className="panel-title">
              <GitBranch size={16} color="#38bdf8" />
              Git Branching Visualizer
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {gitState.commits.length} commits • active: <strong style={{ color: '#38bdf8' }}>{gitState.activeBranch}</strong>
            </span>
          </div>

          <div className="panel-body">
            <GitCanvas
              state={gitState}
              selectedCommitId={selectedCommit?.id || null}
              onSelectCommit={(commit) => setSelectedCommit(commit)}
            />

            {/* Commit Details Inspector if clicked */}
            {selectedCommit && (
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
                  <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                    {selectedCommit.hash}
                  </strong>
                  <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>
                    {selectedCommit.message}
                  </div>
                </div>
                <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '11px' }}>
                  branch: <strong style={{ color: '#a855f7' }}>{selectedCommit.branch}</strong>
                  <div>{selectedCommit.author}</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Panel 2: Live CI/CD Pipeline Simulator */}
        <section className="card-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Play size={16} color="#10b981" />
              CI/CD Pipeline Simulator (Vitest & Vercel)
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Vite + Vitest + GitHub Actions
            </span>
          </div>

          <div className="panel-body">
            <PipelineViewer
              run={pipelineRun}
              selectedStageId={selectedStageId}
              chaosConfig={chaosConfig}
              isRunning={isPipelineRunning}
              onRunPipeline={handleRunPipeline}
              onSelectStage={(stage) => setSelectedStageId(stage.id)}
              onToggleChaos={handleToggleChaos}
            />
          </div>
        </section>

        {/* Panel 3: Terminal & Challenge Console */}
        <section className="card-panel console-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Terminal size={16} color="#a855f7" />
              DevOps Lab & Terminal
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Interactive Shell
            </span>
          </div>

          <div className="panel-body">
            <TerminalConsole
              logs={logs}
              currentScenario={currentScenario}
              onCommand={handleTerminalCommand}
              onNextScenario={handleNextScenario}
            />
          </div>
        </section>
      </main>

      {/* Action Modals */}
      <CommitModal
        isOpen={isCommitModalOpen}
        onClose={() => setIsCommitModalOpen(false)}
        activeBranch={gitState.activeBranch}
        onCommit={handleCommit}
      />

      <BranchModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        state={gitState}
        onCreateBranch={handleCreateBranch}
      />

      <MergeModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        state={gitState}
        onMerge={handleMerge}
      />

      {/* Vercel Monitoring */}
      <Analytics />
      <SpeedInsights />
    </div>
  )
}

export default App
