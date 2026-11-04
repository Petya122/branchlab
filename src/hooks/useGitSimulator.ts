import { useState } from 'react'
import type { BranchingModel, Commit, GitGraphState } from '../types/git'
import {
  checkoutBranch,
  commitToActiveBranch,
  createBranch,
  getInitialGitState,
  mergeBranches,
} from '../utils/gitEngine'
import { errorLine, type LogFn } from './useTerminalLog'

export interface GitSimulatorDeps {
  log: LogFn
  triggerTrophy: (trophyId: string) => void
  /** Called when a new head commit should get a fresh (idle) pipeline run. */
  onNewHead: (hash: string, message: string, branch: string) => void
}

export type ConflictStrategy = 'current' | 'incoming' | 'both'

/** Git graph state for the lab plus every git action the UI and terminal can trigger. */
export function useGitSimulator(initialModel: BranchingModel, deps: GitSimulatorDeps) {
  const { log, triggerTrophy, onNewHead } = deps
  const [model, setModel] = useState<BranchingModel>(initialModel)
  const [gitState, setGitState] = useState<GitGraphState>(() => getInitialGitState(initialModel))
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null)

  /** Feature branches merge into develop, everything else into main. */
  const conflictTarget = gitState.activeBranch.startsWith('feature/') ? 'develop' : 'main'

  const headCommit = gitState.commits.find((c) => c.id === gitState.headCommitId) ?? null

  const changeModel = (newModel: BranchingModel) => {
    const nextState = getInitialGitState(newModel)
    setModel(newModel)
    setGitState(nextState)
    setSelectedCommit(null)
    const latest = nextState.commits[nextState.commits.length - 1]
    onNewHead(latest.hash, latest.message, nextState.activeBranch)
    log(`$ switched branching strategy to ${newModel.toUpperCase()}`, `Active branch: ${nextState.activeBranch}`)
    if (newModel === 'trunk-based') triggerTrophy('trunk-pioneer')
  }

  const commit = (message: string) => {
    const { nextState, newCommit } = commitToActiveBranch(gitState, message)
    setGitState(nextState)
    setSelectedCommit(newCommit)
    log(`$ git commit -m "${message}"`, `[${newCommit.branch} ${newCommit.hash}] ${message}`)
    onNewHead(newCommit.hash, newCommit.message, newCommit.branch)
  }

  const createNewBranch = (branchName: string, fromBranch: string) => {
    try {
      setGitState(createBranch(gitState, branchName, fromBranch))
      log(`$ git checkout -b ${branchName} ${fromBranch}`, `Switched to a new branch '${branchName}'`)
    } catch (err: unknown) {
      log(errorLine(err))
    }
  }

  const checkout = (branchName: string) => {
    try {
      setGitState(checkoutBranch(gitState, branchName))
      log(`Switched to branch '${branchName}'`)
    } catch (err: unknown) {
      log(errorLine(err))
    }
  }

  const merge = (source: string, target: string) => {
    try {
      const { nextState, mergeCommit } = mergeBranches(gitState, source, target)
      setGitState(nextState)
      setSelectedCommit(mergeCommit)
      log(
        `$ git checkout ${target}`,
        `$ git merge ${source}`,
        `Merged branch '${source}' into ${target} [${mergeCommit.hash}]`
      )
      onNewHead(mergeCommit.hash, mergeCommit.message, mergeCommit.branch)
      if (source.startsWith('hotfix/') && target === 'main') triggerTrophy('hotfix-firefighter')
    } catch (err: unknown) {
      log(errorLine(err))
    }
  }

  const resolveConflict = (strategy: ConflictStrategy) => {
    const source = gitState.activeBranch
    const target = conflictTarget
    try {
      const { nextState, mergeCommit } = mergeBranches(gitState, source, target)
      setGitState(nextState)
      setSelectedCommit(mergeCommit)
      log(
        `$ git merge ${source} (Conflict Resolved via strategy: ${strategy})`,
        `Resolved conflict in src/config/api.ts. Created merge commit ${mergeCommit.hash}`
      )
    } catch {
      log(`[CONFLICT] Conflict resolved and committed in ${target}.`)
    }
    triggerTrophy('conflict-master')
  }

  const mergePullRequest = (title: string) => {
    const source = gitState.activeBranch
    try {
      const { nextState, mergeCommit } = mergeBranches(gitState, source, 'main')
      // Squash-merge commits carry the PR title and number
      const prCommit: Commit = { ...mergeCommit, message: `${title} (#24)` }
      setGitState({
        ...nextState,
        commits: nextState.commits.map((c) => (c.id === prCommit.id ? prCommit : c)),
      })
      setSelectedCommit(prCommit)
      log(`$ gh pr merge #24 --squash`, `Pull Request #24 merged into main [${prCommit.hash}]: ${title}`)
      triggerTrophy('pr-champion')
    } catch (err: unknown) {
      log(errorLine(err, '[PR ERROR]'))
    }
  }

  return {
    model,
    gitState,
    headCommit,
    selectedCommit,
    selectCommit: setSelectedCommit,
    conflictTarget,
    changeModel,
    commit,
    createBranch: createNewBranch,
    checkout,
    merge,
    resolveConflict,
    mergePullRequest,
  }
}
