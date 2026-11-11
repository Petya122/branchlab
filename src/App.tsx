import React, { useCallback, useEffect, useState } from 'react'
import type { Trophy } from './utils/trophies'
import { SCENARIOS, firstScenarioIndexFor } from './utils/scenarios'
import { getInitialGitState } from './utils/gitEngine'
import type { BranchingModel } from './types/git'
import { celebrate } from './utils/celebrate'
import { loadSettings, saveSettings, type SettingsState } from './utils/settings'
import { HELP_LINES, parseTerminalCommand } from './utils/terminalCommands'
import { resetTutorialSeen, shouldShowTutorial } from './utils/tutorial'
import { useTerminalLog } from './hooks/useTerminalLog'
import { useTrophies } from './hooks/useTrophies'
import { usePipelineSimulator } from './hooks/usePipelineSimulator'
import { useGitSimulator } from './hooks/useGitSimulator'
import { useModals, type ModalId } from './hooks/useModals'
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

/** Startup terminal text and pipeline target, from the model the lab starts with. */
function initialLab(model: BranchingModel) {
  const state = getInitialGitState(model)
  const head = state.commits.find((c) => c.id === state.headCommitId)!
  return {
    logs: [
      '$ git status',
      `On branch ${state.activeBranch}`,
      `Your branch is up to date with 'origin/${state.activeBranch}'.`,
      'System ready. Type help, use the buttons, or run the pipeline.',
    ],
    pipeline: { commitHash: head.hash, commitMessage: head.message, branch: state.activeBranch },
  }
}

export const App: React.FC = () => {
  const [view, setView] = useState<AppView>('home')
  const [settings, setSettings] = useState<SettingsState>(loadSettings)
  const [start] = useState(() => initialLab(settings.defaultModel))
  // Start with a challenge that matches the default branching model from Settings
  const [scenarioIndex, setScenarioIndex] = useState(() => firstScenarioIndexFor(settings.defaultModel))
  const modals = useModals(shouldShowTutorial() ? 'tutorial' : null)
  const { logs, log, clear } = useTerminalLog(start.logs)

  const onTrophyUnlocked = useCallback(
    (trophy: Trophy) => {
      log(`\n🏆 [ACHIEVEMENT UNLOCKED] ${trophy.title} (+${trophy.xp} XP)!`, `"${trophy.description}"`)
      celebrate({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
    },
    [log]
  )
  const trophies = useTrophies(onTrophyUnlocked)

  const pipeline = usePipelineSimulator(start.pipeline, {
    log,
    triggerTrophy: trophies.triggerTrophy,
    onPassed: () => celebrate({ particleCount: 60, spread: 60, origin: { y: 0.7 } }),
    animationSpeed: settings.animationSpeed,
    initialChaos: SCENARIOS[scenarioIndex].chaos,
  })

  const git = useGitSimulator(settings.defaultModel, {
    log,
    triggerTrophy: trophies.triggerTrophy,
    onNewHead: pipeline.resetPipeline,
    strictBranchProtection: settings.strictBranchProtection,
    ciStatusFor: pipeline.statusFor,
  })

  // A PR or a merge conflict needs a branch to integrate into another one
  const { openModal, closeModal } = modals
  const openLabModal = (id: ModalId) => {
    if ((id === 'pr' || id === 'conflict') && !git.canIntegrate) {
      log(
        `[INFO] You are on '${git.gitState.activeBranch}', the integration target itself.`,
        `Check out or create a feature/hotfix branch first (e.g. git checkout -b feature/my-change).`
      )
      return
    }
    openModal(id)
  }

  // Esc closes whichever modal is open
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeModal])

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
        return log(...git.statusLines())
      case 'log':
        return log(...git.logLines())
      case 'list-branches':
        return log(...git.branchLines())
      // The typed command is already echoed above, so the actions skip their own `$ git ...` line
      case 'commit':
        return git.commit(cmd.message, { echo: false })
      case 'create-branch':
        return git.createBranch(cmd.branch, git.gitState.activeBranch, { echo: false })
      case 'checkout':
        return git.checkout(cmd.branch)
      case 'merge':
        return git.merge(cmd.source, git.gitState.activeBranch, { echo: false })
      case 'unknown':
        return log(`Command not recognized: "${cmd.input}". Type 'help' for available commands.`)
    }
  }

  const handleNextScenario = () => {
    const nextIndex = (scenarioIndex + 1) % SCENARIOS.length
    const scenario = SCENARIOS[nextIndex]
    setScenarioIndex(nextIndex)
    git.changeModel(scenario.initialModel)
    // Each challenge starts from its own pipeline state (e.g. a failing test)
    pipeline.applyChaos(scenario.chaos ?? {})
    log(`\n🎯 Loaded Challenge: ${scenario.title}`, `Objective: ${scenario.objective}`)
    if (scenario.chaos) {
      const injected = Object.keys(scenario.chaos).join(', ')
      log(`[CHAOS CONTROL] Challenge setup: ${injected} ENABLED (Will Fail)`)
    }
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
        onOpenModal={openLabModal}
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
          onOpenModal={openLabModal}
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
          targetBranch={git.integrationTarget}
          onClose={modals.closeModal}
          onResolve={git.resolveConflict}
        />
      )}
      {modals.isOpen('pr') && (
        <PullRequestModal
          isOpen
          prNumber={git.prNumber}
          sourceBranch={git.gitState.activeBranch}
          targetBranch={git.integrationTarget}
          // CI status of the PR branch's own head commit, not of the last run
          ciStatus={git.ciStatusOfBranch(git.gitState.activeBranch)}
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
