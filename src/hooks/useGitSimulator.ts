import { useState } from 'react'
import type { BranchingModel, Commit, GitGraphState } from '../types/git'
import type { PipelineRun } from '../types/pipeline'
import {
  checkoutBranch,
  commitToActiveBranch,
  createBranch,
  getInitialGitState,
  integrationTarget,
  mergeBranches,
  squashMerge,
} from '../utils/gitEngine'
import { errorLine, type LogFn } from './useTerminalLog'

export interface GitSimulatorDeps {
  log: LogFn
  triggerTrophy: (trophyId: string) => void
  /** Called when a new head commit should get a fresh (idle) pipeline run. */
  onNewHead: (hash: string, message: string, branch: string) => void
  /** Settings toggle: enforce the rules of protected branches (main). */
  strictBranchProtection: boolean
  /** CI result of a commit, by hash. */
  ciStatusFor: (commitHash: string) => PipelineRun['status']
}

export type ConflictStrategy = 'current' | 'incoming' | 'both'

/** First PR number shown in the simulator; each merged PR takes the next one. */
const FIRST_PR_NUMBER = 24

/** Git graph state for the lab plus every git action the UI and terminal can trigger. */
export function useGitSimulator(initialModel: BranchingModel, deps: GitSimulatorDeps) {
  const { log, triggerTrophy, onNewHead, strictBranchProtection, ciStatusFor } = deps
  const [model, setModel] = useState<BranchingModel>(initialModel)
  const [gitState, setGitState] = useState<GitGraphState>(() => getInitialGitState(initialModel))
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null)
  const [prNumber, setPrNumber] = useState(FIRST_PR_NUMBER)

  /** GitFlow feature branches integrate into develop, everything else into main. */
  const target = integrationTarget(gitState)
  /** A PR or conflict needs a branch other than its own target to be checked out. */
  const canIntegrate = gitState.activeBranch !== target

  const headCommit = gitState.commits.find((c) => c.id === gitState.headCommitId) ?? null

  const headHashOf = (branchName: string) => {
    const branch = gitState.branches[branchName]
    return gitState.commits.find((c) => c.id === branch?.targetCommitId)?.hash
  }

  /** CI status of the commit a branch points to (what a PR from it would show). */
  const ciStatusOfBranch = (branchName: string): PipelineRun['status'] => {
    const hash = headHashOf(branchName)
    return hash ? ciStatusFor(hash) : 'idle'
  }

  const isProtected = (branchName: string) =>
    strictBranchProtection && Boolean(gitState.branches[branchName]?.isProtected)

  /**
   * GitHub-style "require status checks": a protected branch only accepts
   * changes whose commit passed CI. Returns an error line, or null if allowed.
   */
  const protectionError = (source: string, targetBranch: string): string | null => {
    if (!isProtected(targetBranch)) return null
    if (ciStatusOfBranch(source) === 'passed') return null
    return `[BRANCH PROTECTION] '${targetBranch}' is protected: run the CI/CD pipeline on '${source}' and get it green first.`
  }

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
    if (isProtected(gitState.activeBranch)) {
      log(
        `[BRANCH PROTECTION] Direct commits to '${gitState.activeBranch}' are blocked.`,
        `Create a branch first (git checkout -b feature/...) or set Branch Protection to Permissive in Settings.`
      )
      return
    }
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

  const merge = (source: string, targetBranch: string) => {
    const blocked = protectionError(source, targetBranch)
    if (blocked) return log(blocked)
    try {
      const { nextState, mergeCommit } = mergeBranches(gitState, source, targetBranch)
      setGitState(nextState)
      setSelectedCommit(mergeCommit)
      log(
        `$ git checkout ${targetBranch}`,
        `$ git merge --no-ff ${source}`,
        `Merged branch '${source}' into ${targetBranch} [${mergeCommit.hash}]`
      )
      onNewHead(mergeCommit.hash, mergeCommit.message, mergeCommit.branch)
      if (source.startsWith('hotfix/') && targetBranch === 'main') triggerTrophy('hotfix-firefighter')
    } catch (err: unknown) {
      log(errorLine(err))
    }
  }

  const resolveConflict = (strategy: ConflictStrategy) => {
    const source = gitState.activeBranch
    const blocked = protectionError(source, target)
    if (blocked) return log(blocked)
    try {
      const { nextState, mergeCommit } = mergeBranches(gitState, source, target)
      setGitState(nextState)
      setSelectedCommit(mergeCommit)
      log(
        `$ git merge ${source} (Conflict Resolved via strategy: ${strategy})`,
        `Resolved conflict in src/config/api.ts. Created merge commit ${mergeCommit.hash}`
      )
      onNewHead(mergeCommit.hash, mergeCommit.message, mergeCommit.branch)
      triggerTrophy('conflict-master')
    } catch (err: unknown) {
      log(errorLine(err, '[CONFLICT]'))
    }
  }

  const mergePullRequest = (title: string) => {
    const source = gitState.activeBranch
    const blocked = protectionError(source, target)
    if (blocked) return log(blocked)
    try {
      const message = `${title} (#${prNumber})`
      const { nextState, squashCommit } = squashMerge(gitState, source, target, message)
      setGitState(nextState)
      setSelectedCommit(squashCommit)
      setPrNumber((n) => n + 1)
      log(
        `$ gh pr merge ${prNumber} --squash`,
        `Pull Request #${prNumber} squash-merged into ${target} [${squashCommit.hash}]: ${title}`
      )
      onNewHead(squashCommit.hash, squashCommit.message, squashCommit.branch)
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
    integrationTarget: target,
    canIntegrate,
    prNumber,
    ciStatusOfBranch,
    changeModel,
    commit,
    createBranch: createNewBranch,
    checkout,
    merge,
    resolveConflict,
    mergePullRequest,
  }
}
