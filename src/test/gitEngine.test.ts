import { describe, it, expect } from 'vitest'
import {
  getInitialGitState,
  commitToActiveBranch,
  createBranch,
  checkoutBranch,
  mergeBranches,
  squashMerge,
  isAncestor,
  integrationTarget,
} from '../utils/gitEngine'

describe('gitEngine', () => {
  it('initializes GitFlow state with main, develop, and feature branches', () => {
    const state = getInitialGitState('gitflow')
    expect(state.model).toBe('gitflow')
    expect(state.commits.length).toBeGreaterThanOrEqual(3)
    expect(state.branches['main']).toBeDefined()
    expect(state.branches['develop']).toBeDefined()
    expect(state.branches['feature/auth']).toBeDefined()
    expect(state.activeBranch).toBe('feature/auth')
  })

  it('initializes Trunk-Based state with main and short-lived feature branch', () => {
    const state = getInitialGitState('trunk-based')
    expect(state.model).toBe('trunk-based')
    expect(state.branches['main']).toBeDefined()
    expect(state.branches['feature/fast-patch']).toBeDefined()
  })

  it('adds a new commit and updates the active branch targetCommitId', () => {
    const state = getInitialGitState('gitflow')
    const initialCommitCount = state.commits.length
    const { nextState, newCommit } = commitToActiveBranch(state, 'feat: test commit')

    expect(nextState.commits.length).toBe(initialCommitCount + 1)
    expect(newCommit.message).toBe('feat: test commit')
    expect(newCommit.branch).toBe('feature/auth')
    expect(nextState.branches['feature/auth'].targetCommitId).toBe(newCommit.id)
    expect(nextState.headCommitId).toBe(newCommit.id)
  })

  it('creates a new branch off the active branch', () => {
    const state = getInitialGitState('gitflow')
    const nextState = createBranch(state, 'feature/settings')

    expect(nextState.branches['feature/settings']).toBeDefined()
    expect(nextState.activeBranch).toBe('feature/settings')
    expect(nextState.branches['feature/settings'].targetCommitId).toBe(
      state.branches['feature/auth'].targetCommitId
    )
  })

  it('throws error if branch already exists', () => {
    const state = getInitialGitState('gitflow')
    expect(() => createBranch(state, 'main')).toThrow()
  })

  it('checks out an existing branch', () => {
    const state = getInitialGitState('gitflow')
    const nextState = checkoutBranch(state, 'main')
    expect(nextState.activeBranch).toBe('main')
    expect(nextState.headCommitId).toBe(state.branches['main'].targetCommitId)
  })

  it('merges source branch into target branch with 2 parents', () => {
    const state = getInitialGitState('gitflow')
    const { nextState, mergeCommit } = mergeBranches(state, 'feature/auth', 'develop')

    expect(mergeCommit.isMerge).toBe(true)
    expect(mergeCommit.parents.length).toBe(2)
    expect(mergeCommit.branch).toBe('develop')
    expect(nextState.activeBranch).toBe('develop')
    expect(nextState.branches['develop'].targetCommitId).toBe(mergeCommit.id)
  })

  // Regression: HEAD stayed on the previous branch's commit when the new
  // branch was created from another base (e.g. a hotfix from main).
  it('moves HEAD to the base commit when branching off another branch', () => {
    const state = getInitialGitState('gitflow') // on feature/auth (c3)
    const nextState = createBranch(state, 'hotfix/x', 'main')
    expect(nextState.headCommitId).toBe(state.branches['main'].targetCommitId)
    const { newCommit } = commitToActiveBranch(nextState, 'fix: patch')
    expect(newCommit.parents).toEqual([state.branches['main'].targetCommitId])
  })

  it('refuses to merge a branch into itself', () => {
    const state = getInitialGitState('gitflow')
    expect(() => mergeBranches(state, 'develop', 'develop')).toThrow(/into itself/)
  })

  it('reports "Already up to date" instead of creating an empty merge commit', () => {
    const state = getInitialGitState('gitflow')
    const { nextState } = mergeBranches(state, 'feature/auth', 'develop')
    expect(() => mergeBranches(nextState, 'feature/auth', 'develop')).toThrow(/Already up to date/)
    // main (c1) is an ancestor of develop (c2)
    expect(() => mergeBranches(state, 'main', 'develop')).toThrow(/Already up to date/)
  })

  it('squash-merges into one commit with a single parent', () => {
    const state = getInitialGitState('github-flow')
    const { nextState, squashCommit } = squashMerge(state, 'feature/status-page', 'main', 'feat: status page (#1)')
    expect(squashCommit.parents).toEqual([state.branches['main'].targetCommitId])
    expect(squashCommit.isMerge).toBeFalsy()
    expect(nextState.branches['main'].targetCommitId).toBe(squashCommit.id)
    // The feature branch is not part of main's history after a squash
    expect(isAncestor(nextState, state.branches['feature/status-page'].targetCommitId, squashCommit.id)).toBe(false)
  })

  it('finds ancestors through merge parents', () => {
    const state = getInitialGitState('gitflow')
    const { nextState, mergeCommit } = mergeBranches(state, 'feature/auth', 'develop')
    expect(isAncestor(nextState, 'c3', mergeCommit.id)).toBe(true)
    expect(isAncestor(nextState, 'c1', mergeCommit.id)).toBe(true)
    expect(isAncestor(nextState, mergeCommit.id, 'c1')).toBe(false)
  })

  it('picks the integration target per branching model', () => {
    expect(integrationTarget(getInitialGitState('gitflow'))).toBe('develop') // feature/auth
    expect(integrationTarget(getInitialGitState('github-flow'))).toBe('main') // no develop
    const hotfix = createBranch(getInitialGitState('gitflow'), 'hotfix/x', 'main')
    expect(integrationTarget(hotfix)).toBe('main')
  })
})
