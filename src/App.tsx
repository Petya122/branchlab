import React, { useCallback, useState } from 'react'
import type { Trophy } from './utils/trophies'
import { SCENARIOS } from './utils/scenarios'
import { celebrate } from './utils/celebrate'
import { loadSettings, saveSettings, type SettingsState } from './utils/settings'
import { HELP_LINES, parseTerminalCommand } from './utils/terminalCommands'
import { resetTutorialSeen, shouldShowTutorial } from './utils/tutorial'
import { useTerminalLog } from './hooks/useTerminalLog'
import { useTrophies } from './hooks/useTrophies'
import { usePipelineSimulator } from './hooks/usePipelineSimulator'
import { useGitSimulator } from './hooks/useGitSimulator'
import { useModals } from './hooks/useModals'
import { AppNavbar, type AppView } from './components/AppNavbar'
import { LabDashboard } from './components/LabDashboard'
import { LabQuickActions } from './components/LabQuickActions'
import { HomePage } from './components/HomePage'
import { BranchModal, CommitModal, MergeModal } from './components/ActionModals'
import { MergeConflictModal } from './components/MergeConflictModal'
import { PullRequestModal } from './components/PullRequestModal'
import { TrophyRoomModal } from './components/TrophyRoomModal'
import { TutorialModal } from './components/TutorialModal'
import { SettingsModal } from './components/SettingsModal'

const INITIAL_LOGS = [
  '$ git status',
  'On branch feature/auth',
  'Your branch is up to date with origin/feature/auth.',
  'System ready. Select a model or run pipeline checks.',
]

const INITIAL_PIPELINE = {
  commitHash: '5d88e2b',
  commitMessage: 'feat(auth): implement student sso oauth flow',
  branch: 'feature/auth',
}

export const App: React.FC = () => {
  const [view, setView] = useState<AppView>('home')
  const [settings, setSettings] = useState<SettingsState>(loadSettings)
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const modals = useModals(shouldShowTutorial() ? 'tutorial' : null)
  const { logs, log, clear } = useTerminalLog(INITIAL_LOGS)

  const onTrophyUnlocked = useCallback(
    (trophy: Trophy) => {
      log(`\n🏆 [ACHIEVEMENT UNLOCKED] ${trophy.title} (+${trophy.xp} XP)!`, `"${trophy.description}"`)
      celebrate({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
    },
    [log]
  )
  const trophies = useTrophies(onTrophyUnlocked)

  const pipeline = usePipelineSimulator(INITIAL_PIPELINE, {
    log,
    triggerTrophy: trophies.triggerTrophy,
    onPassed: () => celebrate({ particleCount: 60, spread: 60, origin: { y: 0.7 } }),
    animationSpeed: settings.animationSpeed,
  })

  const git = useGitSimulator(settings.defaultModel, {
    log,
    triggerTrophy: trophies.triggerTrophy,
    onNewHead: pipeline.resetPipeline,
  })

  const runPipeline = () =>
    pipeline.runPipeline({
      commitHash: git.headCommit?.hash ?? 'head000',
      commitMessage: git.headCommit?.message ?? 'manual trigger',
      branch: git.gitState.activeBranch,
    })

  const handleTerminalCommand = (input: string) => {
    log(`$ ${input}`)
    const cmd = parseTerminalCommand(input)
    switch (cmd.kind) {
      case 'help':
        return log(...HELP_LINES)
      case 'clear':
        return clear()
      case 'run-pipeline':
        return void runPipeline()
      case 'status':
        return log(
          `On branch ${git.gitState.activeBranch}`,
          `Head commit: ${git.gitState.headCommitId}`,
          `Total commits in graph: ${git.gitState.commits.length}`
        )
      case 'commit':
        return git.commit(cmd.message)
      case 'create-branch':
        return git.createBranch(cmd.branch, git.gitState.activeBranch)
      case 'checkout':
        return git.checkout(cmd.branch)
      case 'merge':
        return git.merge(cmd.source, git.gitState.activeBranch)
      case 'unknown':
        return log(`Command not recognized: "${cmd.input}". Type 'help' for available commands.`)
    }
  }

  const handleNextScenario = () => {
    const nextIndex = (scenarioIndex + 1) % SCENARIOS.length
    const scenario = SCENARIOS[nextIndex]
    setScenarioIndex(nextIndex)
    git.changeModel(scenario.initialModel)
    log(`\n🎯 Loaded Challenge: ${scenario.title}`, `Objective: ${scenario.objective}`)
  }

  const handleUpdateSettings = (next: SettingsState) => {
    setSettings(next)
    saveSettings(next)
  }

  const handleResetTour = () => {
    resetTutorialSeen()
    modals.openModal('tutorial')
  }

  return (
    <div className="app-container">
      <AppNavbar
        view={view}
        onNavigate={setView}
        model={git.model}
        onModelChange={git.changeModel}
        level={trophies.level}
        xp={trophies.trophyState.xp}
        isPipelineRunning={pipeline.isRunning}
        onOpenModal={modals.openModal}
        onRunPipeline={runPipeline}
      />

      {view === 'home' ? (
        <HomePage
          animationSpeed={settings.animationSpeed}
          onLaunchLab={() => setView('lab')}
          onOpenTour={() => modals.openModal('tutorial')}
        />
      ) : (
        <LabDashboard
          gitState={git.gitState}
          selectedCommit={git.selectedCommit}
          onSelectCommit={git.selectCommit}
          pipelineRun={pipeline.pipelineRun}
          selectedStageId={pipeline.selectedStageId}
          onSelectStage={(stage) => pipeline.selectStage(stage.id)}
          chaosConfig={pipeline.chaosConfig}
          isPipelineRunning={pipeline.isRunning}
          onRunPipeline={runPipeline}
          onToggleChaos={pipeline.toggleChaos}
          logs={logs}
          scenario={SCENARIOS[scenarioIndex]}
          onCommand={handleTerminalCommand}
          onNextScenario={handleNextScenario}
        />
      )}

      {view === 'lab' && (
        <LabQuickActions
          variant="mobile"
          isPipelineRunning={pipeline.isRunning}
          onOpenModal={modals.openModal}
          onRunPipeline={runPipeline}
        />
      )}

      {/* Modals mount only while open, so each one starts from the current
          lab state (active branch, PR title...) instead of the first render's. */}
      {modals.isOpen('commit') && (
        <CommitModal
          isOpen
          onClose={modals.closeModal}
          activeBranch={git.gitState.activeBranch}
          onCommit={git.commit}
        />
      )}
      {modals.isOpen('branch') && (
        <BranchModal isOpen onClose={modals.closeModal} state={git.gitState} onCreateBranch={git.createBranch} />
      )}
      {modals.isOpen('merge') && (
        <MergeModal isOpen onClose={modals.closeModal} state={git.gitState} onMerge={git.merge} />
      )}
      {modals.isOpen('conflict') && (
        <MergeConflictModal
          isOpen
          sourceBranch={git.gitState.activeBranch}
          targetBranch={git.conflictTarget}
          onClose={modals.closeModal}
          onResolve={git.resolveConflict}
        />
      )}
      {modals.isOpen('pr') && (
        <PullRequestModal
          isOpen
          sourceBranch={git.gitState.activeBranch}
          targetBranch="main"
          ciStatus={pipeline.pipelineRun.status}
          onClose={modals.closeModal}
          onMergePR={git.mergePullRequest}
        />
      )}
      {modals.isOpen('trophies') && (
        <TrophyRoomModal isOpen trophyState={trophies.trophyState} onClose={modals.closeModal} />
      )}
      {modals.isOpen('tutorial') && <TutorialModal isOpen onClose={modals.closeModal} />}
      {modals.isOpen('settings') && (
        <SettingsModal
          isOpen
          settings={settings}
          gitState={git.gitState}
          trophyState={trophies.trophyState}
          onClose={modals.closeModal}
          onUpdateSettings={handleUpdateSettings}
          onResetTrophies={trophies.resetTrophies}
          onResetTour={handleResetTour}
        />
      )}
    </div>
  )
}

export default App
