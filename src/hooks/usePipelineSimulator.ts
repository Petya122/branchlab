import { useCallback, useRef, useState } from 'react'
import type { PipelineFailureConfig, PipelineRun } from '../types/pipeline'
import type { SettingsState } from '../utils/settings'
import {
  createInitialPipelineRun,
  generateStageLogs,
  shouldStageFail,
} from '../utils/pipelineEngine'
import type { LogFn } from './useTerminalLog'

export interface PipelineSimulatorDeps {
  log: LogFn
  triggerTrophy: (trophyId: string) => void
  /** Visual celebration (confetti) when a run passes. */
  onPassed: () => void
  animationSpeed: SettingsState['animationSpeed']
}

export interface PipelineTarget {
  commitHash: string
  commitMessage: string
  branch: string
}

const STAGE_DELAY_MS: Record<SettingsState['animationSpeed'], number> = {
  fast: 220,
  normal: 420,
  relaxed: 650,
}

const NO_CHAOS: PipelineFailureConfig = {
  failLint: false,
  failTests: false,
  failSecurity: false,
  failBuild: false,
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Simulated CI/CD run: stages execute one by one, chaos toggles inject failures. */
export function usePipelineSimulator(initialRun: PipelineTarget, deps: PipelineSimulatorDeps) {
  const { log, triggerTrophy, onPassed, animationSpeed } = deps
  const [pipelineRun, setPipelineRun] = useState<PipelineRun>(() =>
    createInitialPipelineRun(initialRun.commitHash, initialRun.commitMessage, initialRun.branch)
  )
  const [selectedStageId, setSelectedStageId] = useState<string | null>('lint')
  const [isRunning, setIsRunning] = useState(false)
  const [chaosConfig, setChaosConfig] = useState<PipelineFailureConfig>(NO_CHAOS)
  // CI result per commit hash, like GitHub's commit status checks. The PR
  // gate looks up the head commit of the PR's branch here, so a green run on
  // another branch can't be reused after switching branches.
  const [resultsByCommit, setResultsByCommit] = useState<Record<string, PipelineRun['status']>>({})
  // Guards against double starts within the same render (e.g. two fast clicks)
  const runningRef = useRef(false)

  const statusFor = useCallback(
    (commitHash: string): PipelineRun['status'] => resultsByCommit[commitHash] ?? 'idle',
    [resultsByCommit]
  )
  const recordResult = (commitHash: string, status: PipelineRun['status']) =>
    setResultsByCommit((prev) => ({ ...prev, [commitHash]: status }))

  /** Shows a fresh, not-yet-run pipeline for a new head commit. */
  const resetPipeline = useCallback((hash: string, message: string, branch: string) => {
    setPipelineRun(createInitialPipelineRun(hash, message, branch))
  }, [])

  const toggleChaos = (key: keyof PipelineFailureConfig) => {
    const enabled = !chaosConfig[key]
    setChaosConfig({ ...chaosConfig, [key]: enabled })
    log(`[CHAOS CONTROL] ${key} is now ${enabled ? 'ENABLED (Will Fail)' : 'DISABLED (Will Pass)'}`)
  }

  const runPipeline = async ({ commitHash, commitMessage, branch }: PipelineTarget) => {
    if (runningRef.current) return
    runningRef.current = true
    setIsRunning(true)

    const run = createInitialPipelineRun(commitHash, commitMessage, branch)
    run.status = 'running'
    run.startedAt = Date.now()
    const stages = run.stages
    setPipelineRun({ ...run })
    recordResult(commitHash, 'running')
    log(`\n--- [CI/CD TRIGGERED] On branch '${branch}' (${commitHash}) ---`)

    let failed = false
    for (const stage of stages) {
      stage.status = 'running'
      setSelectedStageId(stage.id)
      setPipelineRun({ ...run, stages: [...stages] })

      await sleep(STAGE_DELAY_MS[animationSpeed])

      const fails = shouldStageFail(stage.id, chaosConfig)
      const stageLogs = generateStageLogs(stage.id, !fails, branch, commitHash)
      stage.logs = stageLogs
      stage.durationMs = 380 + Math.floor(Math.random() * 150)
      stage.status = fails ? 'failed' : 'success'
      log(...stageLogs)

      if (fails) {
        failed = true
        run.status = 'failed'
        setPipelineRun({ ...run, stages: [...stages] })
        break
      }
      setPipelineRun({ ...run, stages: [...stages] })
    }

    if (failed) {
      recordResult(commitHash, 'failed')
      log(`[CI/CD RESULT] Pipeline terminated with errors. Deployment aborted. ❌`)
    } else {
      run.status = 'passed'
      setPipelineRun({ ...run, stages: [...stages] })
      recordResult(commitHash, 'passed')
      log(
        branch === 'main'
          ? `[CI/CD RESULT] All checks passed! Production release live on https://branchlab.tech ✨`
          : `[CI/CD RESULT] All checks passed on '${branch}' ✨ Preview deployed; merge to main to release.`
      )
      triggerTrophy('quality-gatekeeper')
      onPassed()
    }

    runningRef.current = false
    setIsRunning(false)
  }

  return {
    pipelineRun,
    selectedStageId,
    selectStage: setSelectedStageId,
    isRunning,
    chaosConfig,
    toggleChaos,
    resetPipeline,
    runPipeline,
    statusFor,
  }
}
