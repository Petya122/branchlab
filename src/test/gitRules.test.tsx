import { describe, it, expect, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useGitSimulator } from '../hooks/useGitSimulator'
import type { BranchingModel } from '../types/git'

/**
 * WHY: these are the team rules the lab enforces on top of plain Git: a
 * protected main branch, CI-gated merges, pull requests and conflict
 * resolution. They are the DevOps lesson of the app; if one silently stops
 * working, the simulator teaches that "anything goes".
 */

type CiStatus = 'idle' | 'running' | 'passed' | 'failed'

function setup(opts: { model?: BranchingModel; strict?: boolean; ci?: CiStatus } = {}) {
  const deps = {
    log: vi.fn(),
    triggerTrophy: vi.fn(),
    onNewHead: vi.fn(),
    strictBranchProtection: opts.strict ?? true,
    ciStatusFor: (): CiStatus => opts.ci ?? 'passed',
  }
  const hook = renderHook(() => useGitSimulator(opts.model ?? 'gitflow', deps))
  const logged = () => deps.log.mock.calls.flat().map(String)
  const commits = () => hook.result.current.gitState.commits.length
  return { ...hook, deps, logged, commits }
}

describe('protected main branch (Strict Branch Protection on)', () => {
  it('blocks direct commits to main', () => {
    const { result, logged, commits } = setup()
    act(() => result.current.checkout('main'))
    const before = commits()
    act(() => result.current.commit('fix: straight to prod'))
    expect(commits()).toBe(before)
    expect(logged().some((l) => l.startsWith("[BRANCH PROTECTION] Direct commits to 'main'"))).toBe(true)
  })

  it('blocks a merge into main while the source branch has no green CI', () => {
    const { result, logged, commits } = setup({ ci: 'failed' })
    act(() => result.current.createBranch('hotfix/untested', 'main'))
    act(() => result.current.commit('fix: untested'))
    const before = commits()
    act(() => result.current.merge('hotfix/untested', 'main'))
    expect(commits()).toBe(before)
    expect(logged().some((l) => l.startsWith("[BRANCH PROTECTION] 'main' is protected"))).toBe(true)
  })

  it('allows the merge once CI is green, and rewards a hotfix into main', () => {
    const { result, deps } = setup({ ci: 'passed' })
    act(() => result.current.createBranch('hotfix/urgent', 'main'))
    act(() => result.current.commit('fix: patch'))
    act(() => result.current.merge('hotfix/urgent', 'main'))
    expect(result.current.gitState.activeBranch).toBe('main')
    expect(deps.triggerTrophy).toHaveBeenCalledWith('hotfix-firefighter')
  })

  it('does not protect develop, and Permissive mode lifts all rules', () => {
    const unprotected = setup({ ci: 'idle' })
    act(() => unprotected.result.current.merge('feature/auth', 'develop'))
    expect(unprotected.result.current.gitState.activeBranch).toBe('develop')

    const permissive = setup({ strict: false, ci: 'idle' })
    act(() => permissive.result.current.checkout('main'))
    const before = permissive.commits()
    act(() => permissive.result.current.commit('fix: allowed'))
    expect(permissive.commits()).toBe(before + 1)
  })
})

describe('pull requests', () => {
  it('squash-merge: one single-parent commit titled after the PR, and the next PR gets a new number', () => {
    const { result, deps } = setup()
    const developTip = result.current.gitState.branches['develop'].targetCommitId
    act(() => result.current.mergePullRequest('feat: SSO login'))
    const squash = result.current.selectedCommit!
    expect(squash.message).toBe('feat: SSO login (#24)')
    expect(squash.branch).toBe('develop') // GitFlow: feature → develop
    expect(squash.parents).toEqual([developTip])
    expect(result.current.prNumber).toBe(25)
    expect(deps.triggerTrophy).toHaveBeenCalledWith('pr-champion')
  })
})

describe('merge conflicts', () => {
  it('resolving creates a real merge commit and awards the trophy', () => {
    const { result, deps, commits } = setup()
    const before = commits()
    act(() => result.current.resolveConflict('both'))
    expect(commits()).toBe(before + 1)
    expect(result.current.selectedCommit?.isMerge).toBe(true)
    expect(deps.triggerTrophy).toHaveBeenCalledWith('conflict-master')
  })

  // Regression: GitHub Flow has no develop branch; the merge used to fail
  // silently while still printing "resolved" and awarding the trophy.
  it('in GitHub Flow the conflict really merges into main', () => {
    const { result, commits } = setup({ model: 'github-flow' })
    const before = commits()
    act(() => result.current.resolveConflict('incoming'))
    expect(commits()).toBe(before + 1)
    expect(result.current.gitState.activeBranch).toBe('main')
  })

  it('a failed merge is reported, with no fake success and no trophy', () => {
    const { result, deps, logged } = setup()
    act(() => result.current.resolveConflict('both'))
    act(() => result.current.checkout('feature/auth'))
    deps.triggerTrophy.mockClear()
    act(() => result.current.resolveConflict('both')) // nothing new to merge
    expect(logged().some((l) => l.startsWith('[CONFLICT] Already up to date'))).toBe(true)
    expect(deps.triggerTrophy).not.toHaveBeenCalled()
  })
})

describe('robustness', () => {
  it('invalid operations are logged as errors instead of crashing the app', () => {
    const { result, logged } = setup()
    expect(() => {
      act(() => result.current.createBranch('main', 'develop'))
      act(() => result.current.merge('nope', 'develop'))
      act(() => result.current.checkout('nope'))
    }).not.toThrow()
    expect(logged().filter((l) => l.startsWith('[ERROR]'))).toHaveLength(3)
  })
})
